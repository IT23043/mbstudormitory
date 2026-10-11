/**
 * MBSTU Hall Management System - Authentication & Authorization Layer
 * Clean institutional role checks and session management.
 */

const AUTH_SESSION_KEY = 'mbstu_active_user_session';

const Auth = {
  /**
   * Retrieves the currently logged in user session
   */
  getUser() {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    try {
      const sessionUser = JSON.parse(raw);
      const freshUser = DB.getUserById(sessionUser.id);
      return freshUser || sessionUser;
    } catch (e) {
      return null;
    }
  },

  /**
   * Checks if email conforms to MBSTU institutional domain
   */
  isValidInstitutionalEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    return clean.endsWith('mbstu.acu.bd') || clean.endsWith('mbstu.ac.bd');
  },

  /**
   * Authenticate user with credentials and role
   */
  async login(email, password, expectedRole = null, rememberMe = true) {
    await DB.init();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Please enter both institutional email and password.');
    }

    if (!this.isValidInstitutionalEmail(cleanEmail)) {
      throw new Error('Institutional email must end with @mbstu.acu.bd or @mbstu.ac.bd');
    }

    const user = DB.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('Account not found with this institutional email.');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new Error(`This account is registered as a ${user.role}. Please switch to the ${user.role} tab.`);
    }

    const sessionData = JSON.stringify(user);
    sessionStorage.setItem(AUTH_SESSION_KEY, sessionData);
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionData);
    }

    return user;
  },

  /**
   * Register a new student account
   */
  async registerStudent(studentData) {
    await DB.init();
    const email = (studentData.email || '').trim().toLowerCase();

    if (!this.isValidInstitutionalEmail(email)) {
      throw new Error('Registration requires a valid MBSTU institutional email (e.g. yourname@mbstu.acu.bd).');
    }

    if (!studentData.studentId || !studentData.studentId.trim()) {
      throw new Error('Valid Student ID is required.');
    }

    if (!studentData.hallId) {
      throw new Error('Please select an eligible residence hall.');
    }

    const hall = DB.getHallById(studentData.hallId);
    if (!hall) {
      throw new Error('Selected hall was not found in the database.');
    }

    if (hall.gender !== studentData.gender) {
      throw new Error(`Invalid Hall Choice: ${hall.name} is strictly for ${hall.gender} students.`);
    }

    const newUser = DB.createUser({
      role: 'student',
      name: studentData.name,
      email: email,
      password: studentData.password,
      studentId: studentData.studentId.trim(),
      department: studentData.department,
      session: studentData.session || '2022-23',
      gender: studentData.gender,
      hallId: hall.id,
      hallName: hall.name,
      residentStatus: studentData.residentStatus || 'Non-Resident',
      roomNo: studentData.residentStatus === 'Permanent Resident' ? 'Pending Allocation' : 'Unallocated',
      seatNo: 'N/A',
      phone: studentData.phone || '',
      bloodGroup: studentData.bloodGroup || 'O+',
      homeDistrict: studentData.homeDistrict || 'Dhaka',
      walletBalance: 300
    });

    const sessionData = JSON.stringify(newUser);
    sessionStorage.setItem(AUTH_SESSION_KEY, sessionData);
    return newUser;
  },

  logout() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    window.location.href = 'login.html';
  },

  requireAuth() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  },

  requireStudent() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    if (user.role !== 'student') {
      window.location.href = 'admin-dashboard.html';
      return null;
    }
    return user;
  },

  requireAuthority() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    if (user.role !== 'authority') {
      window.location.href = 'student-dashboard.html';
      return null;
    }
    return user;
  },

  renderNavbarAuth(navContainerId = 'navbar-auth-container') {
    const container = document.getElementById(navContainerId);
    if (!container) return;

    const user = this.getUser();
    if (!user) {
      container.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="login.html" class="btn btn-outline-primary btn-sm px-3 rounded-pill">
            Login
          </a>
          <a href="register.html" class="btn btn-primary btn-sm px-3 rounded-pill shadow-sm">
            Register
          </a>
        </div>
      `;
    } else {
      const isStudent = user.role === 'student';
      const dashboardLink = isStudent ? 'student-dashboard.html' : 'admin-dashboard.html';
      const roleBadge = isStudent 
        ? '<span class="badge bg-light text-dark border">Student</span>' 
        : '<span class="badge bg-dark text-white">Authority</span>';

      container.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-light btn-sm rounded-pill dropdown-toggle d-flex align-items-center gap-2 border px-2 py-1 shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <span class="d-none d-sm-inline fw-semibold text-truncate" style="max-width: 140px;">${user.name}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow border mt-2 rounded-3 p-2" style="min-width: 220px;">
            <li class="px-3 py-2 border-bottom mb-2">
              <div class="fw-bold text-dark text-truncate">${user.name}</div>
              <div class="small text-muted text-truncate">${user.email}</div>
              <div class="mt-1">${roleBadge}</div>
            </li>
            <li><a class="dropdown-item rounded py-2" href="${dashboardLink}">Dashboard</a></li>
            ${isStudent ? `
              <li><a class="dropdown-item rounded py-2" href="meal-tokens.html">Meal Tokens</a></li>
              <li><a class="dropdown-item rounded py-2" href="seat-application.html">Seat Application</a></li>
            ` : `
              <li><a class="dropdown-item rounded py-2" href="admin-seats.html">Seat Allocation</a></li>
              <li><a class="dropdown-item rounded py-2" href="admin-meals.html">Dining Manager</a></li>
              <li><a class="dropdown-item rounded py-2" href="admin-notices.html">Notices</a></li>
            `}
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <button class="dropdown-item rounded py-2 text-danger" onclick="Auth.logout()">
                Logout
              </button>
            </li>
          </ul>
        </div>
      `;
    }
  }
};
