/**
 * MBSTU Hall Management System - Database & Local Storage Layer
 * Supports full CRUD operations, JSON import/export, and persistence.
 * Works seamlessly on GitHub Pages without any Node server requirement.
 */

const DB_KEY = 'mbstu_hall_db_v1';

const DB = {
  // In-memory cache
  data: null,

  /**
   * Initializes the database from localStorage or default JSON
   */
  async init() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
        return this.data;
      } catch (e) {
        console.warn('Corrupted local storage data, reinitializing from default JSON', e);
      }
    }

    // Attempt to load from data/default_data.json
    try {
      const response = await fetch('./data/default_data.json');
      if (response.ok) {
        this.data = await response.json();
        this.save();
        return this.data;
      }
    } catch (err) {
      console.warn('Fetch default_data.json failed, loading fallback data', err);
    }

    // Fallback seed data if fetch fails (e.g., opened via file:// protocol directly)
    this.data = this.getFallbackSeed();
    this.save();
    return this.data;
  },

  /**
   * Commit state to localStorage
   */
  save() {
    if (this.data) {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }
  },

  /**
   * Reset database back to factory seed data
   */
  async reset() {
    localStorage.removeItem(DB_KEY);
    this.data = null;
    return await this.init();
  },

  /**
   * Export all data as downloadable JSON file
   */
  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mbstu_hall_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Import data from JSON string
   */
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.halls && parsed.users) {
        this.data = parsed;
        this.save();
        return { success: true };
      }
      return { success: false, message: 'Invalid schema: Missing required tables.' };
    } catch (e) {
      return { success: false, message: 'Malformed JSON file.' };
    }
  },

  /* ==========================================================
   * HALL OPERATIONS
   * ========================================================== */
  getHalls() {
    return this.data?.halls || [];
  },

  getHallById(id) {
    return this.getHalls().find(h => h.id === id);
  },

  getHallsByGender(gender) {
    return this.getHalls().filter(h => h.gender.toLowerCase() === gender.toLowerCase());
  },

  updateHall(id, updates) {
    const hall = this.getHallById(id);
    if (!hall) return null;
    Object.assign(hall, updates);
    this.save();
    return hall;
  },

  /* ==========================================================
   * USER & AUTH OPERATIONS
   * ========================================================== */
  getUsers() {
    return this.data?.users || [];
  },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(userData) {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('A user with this institutional email already exists.');
    }
    const newId = (userData.role === 'authority' ? 'USR-T' : 'USR-S') + String(Date.now()).slice(-4);
    const newUser = {
      id: newId,
      walletBalance: userData.walletBalance || 300,
      avatar: userData.gender === 'Female' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      ...userData
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  },

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    return user;
  },

  /* ==========================================================
   * MEAL TOKEN OPERATIONS
   * ========================================================== */
  getMealSettings() {
    return this.data?.mealSettings || {};
  },

  updateMealSetting(slot, updates) {
    if (this.data.mealSettings[slot]) {
      Object.assign(this.data.mealSettings[slot], updates);
      this.save();
      return this.data.mealSettings[slot];
    }
    return null;
  },

  getMealTokens(filters = {}) {
    let tokens = [...(this.data?.mealTokens || [])];
    if (filters.userId) {
      tokens = tokens.filter(t => t.userId === filters.userId);
    }
    if (filters.hallId) {
      tokens = tokens.filter(t => t.hallId === filters.hallId);
    }
    if (filters.date) {
      tokens = tokens.filter(t => t.date === filters.date);
    }
    if (filters.mealSlot) {
      tokens = tokens.filter(t => t.mealSlot.toLowerCase() === filters.mealSlot.toLowerCase());
    }
    if (filters.status) {
      tokens = tokens.filter(t => t.status.toLowerCase() === filters.status.toLowerCase());
    }
    return tokens.sort((a, b) => (b.tokenId > a.tokenId ? 1 : -1));
  },

  getMealTokenById(tokenId) {
    return (this.data?.mealTokens || []).find(t => t.tokenId === tokenId);
  },

  createMealToken(tokenData) {
    // Check if token already booked for same user, slot, date
    const existing = (this.data.mealTokens || []).find(
      t => t.userId === tokenData.userId && t.date === tokenData.date && t.mealSlot === tokenData.mealSlot && t.status !== 'Cancelled'
    );
    if (existing) {
      throw new Error(`You already have an active meal token for ${tokenData.mealSlot} on ${tokenData.date}.`);
    }

    const todayStr = (tokenData.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const tokenId = `TKN-${todayStr}-${randomHex}`;

    const newToken = {
      tokenId,
      status: 'Active',
      bookedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      redeemedAt: null,
      ...tokenData
    };

    if (!this.data.mealTokens) this.data.mealTokens = [];
    this.data.mealTokens.unshift(newToken);

    // Deduct user wallet if paid via campus wallet
    if (tokenData.paymentMethod === 'Campus Wallet') {
      const user = this.getUserById(tokenData.userId);
      if (user) {
        if (user.walletBalance < tokenData.price) {
          throw new Error(`Insufficient wallet balance (${user.walletBalance} BDT). Required: ${tokenData.price} BDT.`);
        }
        user.walletBalance -= tokenData.price;
      }
    }

    this.save();
    return newToken;
  },

  redeemMealToken(tokenId) {
    const token = this.getMealTokenById(tokenId);
    if (!token) throw new Error('Token not found.');
    if (token.status === 'Redeemed') throw new Error('Token has already been redeemed.');
    if (token.status === 'Cancelled') throw new Error('Cannot redeem a cancelled token.');

    token.status = 'Redeemed';
    token.redeemedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    this.save();
    return token;
  },

  cancelMealToken(tokenId, refund = true) {
    const token = this.getMealTokenById(tokenId);
    if (!token) throw new Error('Token not found.');
    if (token.status === 'Redeemed') throw new Error('Cannot cancel already redeemed token.');
    if (token.status === 'Cancelled') throw new Error('Token is already cancelled.');

    token.status = 'Cancelled';

    // Refund wallet balance if applicable
    if (refund && token.paymentMethod === 'Campus Wallet') {
      const user = this.getUserById(token.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + token.price;
      }
    }

    this.save();
    return token;
  },

  /* ==========================================================
   * SEAT APPLICATION OPERATIONS
   * ========================================================== */
  getSeatApplications(filters = {}) {
    let apps = [...(this.data?.seatApplications || [])];
    if (filters.userId) {
      apps = apps.filter(a => a.userId === filters.userId);
    }
    if (filters.hallId) {
      apps = apps.filter(a => a.hallId === filters.hallId);
    }
    if (filters.status) {
      apps = apps.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
    }
    return apps.sort((a, b) => (b.appId > a.appId ? 1 : -1));
  },

  getSeatApplicationById(appId) {
    return (this.data?.seatApplications || []).find(a => a.appId === appId);
  },

  createSeatApplication(appData) {
    // Check if student has open pending application
    const openApp = (this.data.seatApplications || []).find(
      a => a.userId === appData.userId && a.status === 'Pending'
    );
    if (openApp) {
      throw new Error('You already have a pending seat application under review.');
    }

    const year = new Date().getFullYear();
    const count = (this.data.seatApplications?.length || 0) + 1;
    const appId = `APP-${year}-${String(count).padStart(3, '0')}`;

    const newApp = {
      appId,
      status: 'Pending',
      appliedDate: new Date().toISOString().slice(0, 10),
      reviewedBy: null,
      reviewedDate: null,
      allocatedRoom: null,
      allocatedSeat: null,
      remarks: 'Application submitted successfully. Waiting for Provost evaluation.',
      ...appData
    };

    if (!this.data.seatApplications) this.data.seatApplications = [];
    this.data.seatApplications.unshift(newApp);
    this.save();
    return newApp;
  },

  updateSeatApplicationStatus(appId, status, details = {}) {
    const app = this.getSeatApplicationById(appId);
    if (!app) throw new Error('Seat application not found.');

    app.status = status;
    app.reviewedBy = details.reviewedBy || 'Hall Provost';
    app.reviewedDate = new Date().toISOString().slice(0, 10);
    if (details.remarks) app.remarks = details.remarks;
    if (details.allocatedRoom) app.allocatedRoom = details.allocatedRoom;
    if (details.allocatedSeat) app.allocatedSeat = details.allocatedSeat;

    // If approved, update student's profile & hall count
    if (status === 'Approved') {
      const user = this.getUserById(app.userId);
      if (user) {
        user.residentStatus = 'Permanent Resident';
        user.hallId = app.hallId;
        user.hallName = app.hallName;
        user.roomNo = app.allocatedRoom || 'TBA';
        user.seatNo = app.allocatedSeat || 'A';
      }
      const hall = this.getHallById(app.hallId);
      if (hall && hall.available > 0) {
        hall.available -= 1;
        hall.occupied += 1;
      }
    }

    this.save();
    return app;
  },

  /* ==========================================================
   * NOTICE OPERATIONS
   * ========================================================== */
  getNotices(filters = {}) {
    let notices = [...(this.data?.notices || [])];
    if (filters.hallId && filters.hallId !== 'all') {
      notices = notices.filter(n => n.hallId === filters.hallId || n.hallId === 'all');
    }
    if (filters.category) {
      notices = notices.filter(n => n.category.toLowerCase() === filters.category.toLowerCase());
    }
    return notices.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  },

  createNotice(noticeData) {
    const id = `NOT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const newNotice = {
      id,
      publishDate: new Date().toISOString().slice(0, 10),
      ...noticeData
    };
    if (!this.data.notices) this.data.notices = [];
    this.data.notices.unshift(newNotice);
    this.save();
    return newNotice;
  },

  deleteNotice(id) {
    const idx = (this.data.notices || []).findIndex(n => n.id === id);
    if (idx !== -1) {
      this.data.notices.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  },

  /* ==========================================================
   * COMPLAINT OPERATIONS
   * ========================================================== */
  getComplaints(filters = {}) {
    let list = [...(this.data?.complaints || [])];
    if (filters.userId) {
      list = list.filter(c => c.userId === filters.userId);
    }
    if (filters.hallId) {
      list = list.filter(c => c.hallId === filters.hallId);
    }
    return list.sort((a, b) => (b.id > a.id ? 1 : -1));
  },

  createComplaint(complaintData) {
    const id = `CMP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const newComplaint = {
      id,
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
      response: 'Acknowledged. Assigned to maintenance team.',
      ...complaintData
    };
    if (!this.data.complaints) this.data.complaints = [];
    this.data.complaints.unshift(newComplaint);
    this.save();
    return newComplaint;
  },

  updateComplaint(id, updates) {
    const comp = (this.data.complaints || []).find(c => c.id === id);
    if (comp) {
      Object.assign(comp, updates);
      this.save();
      return comp;
    }
    return null;
  },

  /* ==========================================================
   * STATISTICAL AGGREGATES FOR DASHBOARDS
   * ========================================================== */
  getGlobalStats(hallId = null) {
    const halls = hallId ? this.getHalls().filter(h => h.id === hallId) : this.getHalls();
    const totalCapacity = halls.reduce((sum, h) => sum + (h.capacity || 0), 0);
    const totalOccupied = halls.reduce((sum, h) => sum + (h.occupied || 0), 0);
    const totalAvailable = halls.reduce((sum, h) => sum + (h.available || 0), 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const allTokens = this.data?.mealTokens || [];
    const tokensToday = allTokens.filter(t => t.date === todayStr && t.status !== 'Cancelled');

    const morningTokens = tokensToday.filter(t => t.mealSlot === 'Morning').length;
    const noonTokens = tokensToday.filter(t => t.mealSlot === 'Noon').length;
    const nightTokens = tokensToday.filter(t => t.mealSlot === 'Night').length;

    const allApps = this.data?.seatApplications || [];
    const pendingApps = allApps.filter(a => a.status === 'Pending').length;
    const approvedApps = allApps.filter(a => a.status === 'Approved').length;

    const students = (this.data?.users || []).filter(u => u.role === 'student');

    return {
      totalHalls: halls.length,
      totalCapacity,
      totalOccupied,
      totalAvailable,
      occupancyPercent: totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      totalStudents: students.length,
      tokensTodayCount: tokensToday.length,
      morningTokens,
      noonTokens,
      nightTokens,
      pendingApps,
      approvedApps
    };
  },

  /**
   * Complete fallback dataset if JSON file fails to load
   */
  getFallbackSeed() {
    return {
      halls: [
        { id: "jamh", name: "Jananeta Abdul Mannan Hall", gender: "Male", provost: "Dr. Md. Mizanur Rahman Moghal", capacity: 420, occupied: 388, available: 32, totalRooms: 105, floors: 5, contact: "jamh.provost@mbstu.acu.bd", established: 2004, description: "One of the premier male residence halls at MBSTU featuring multi-storey residential blocks, study halls, and dining facilities." },
        { id: "sohh", name: "Shaheed Osman Hadi Hall", gender: "Male", provost: "Dr. Md. Ishtiaq Ahmed Talukder", capacity: 400, occupied: 360, available: 40, totalRooms: 100, floors: 5, contact: "sohh.provost@mbstu.acu.bd", established: 2008, description: "Modern residential hall equipped with high-speed campus Wi-Fi, modern library wing, indoor sports room, and dynamic canteen." },
        { id: "szrh", name: "Shahid Ziaur Rahman Hall", gender: "Male", provost: "Professor Dr. Md. Abir Hossain", capacity: 450, occupied: 415, available: 35, totalRooms: 112, floors: 5, contact: "szrh.provost@mbstu.acu.bd", established: 2002, description: "Centrally located hall with expansive courtyard, reading room, mosque, dedicated automated dining hall, and guest rooms." },
        { id: "safh", name: "Shaheed Abrar Fahad Hall", gender: "Male", provost: "Dr. Md. Abdullah Al Mamun", capacity: 380, occupied: 330, available: 50, totalRooms: 95, floors: 4, contact: "safh.provost@mbstu.acu.bd", established: 2024, description: "Newly inaugurated modern hall with smart card access, eco-friendly solar rooftops, computerized token mess, and gymnasium." },
        { id: "akbh", name: "Alema Khatun Bhashani Hall", gender: "Female", provost: "Ms. Priti Sarker", capacity: 420, occupied: 390, available: 30, totalRooms: 105, floors: 5, contact: "akbh.provost@mbstu.acu.bd", established: 2005, description: "Flagship female residence hall offering 24/7 security, lush green gardens, reading rooms, automated dining, and recreation halls." },
        { id: "sjjih", name: "Shahid Janoni Jahanara Imam Hall", gender: "Female", provost: "Mst. Nurjahan Khatun", capacity: 460, occupied: 425, available: 35, totalRooms: 115, floors: 5, contact: "sjjih.provost@mbstu.acu.bd", established: 2012, description: "Spacious female student dormitory equipped with dedicated medical aid corner, student lounge, internet labs, and modern dining." },
        { id: "bfzh", name: "Begum Fazilatunnessa Zoha Hall", gender: "Female", provost: "Dr. Most. Chand Sultana Khatun", capacity: 390, occupied: 355, available: 35, totalRooms: 98, floors: 4, contact: "bfzh.provost@mbstu.acu.bd", established: 2018, description: "Modern architecture female residence hall featuring serene study environments, computerized mess management, and indoor games." }
      ],
      users: [
        { id: "USR-S01", email: "student.male@mbstu.acu.bd", password: "student123", role: "student", name: "Tanvir Ahmed", studentId: "IT-21045", department: "Information & Communication Technology", session: "2020-21", gender: "Male", hallId: "safh", hallName: "Shaheed Abrar Fahad Hall", residentStatus: "Permanent Resident", roomNo: "304", seatNo: "B", phone: "+8801711223344", walletBalance: 450, bloodGroup: "O+", homeDistrict: "Dhaka" },
        { id: "USR-S02", email: "student.female@mbstu.acu.bd", password: "student123", role: "student", name: "Nusrat Jahan", studentId: "CSE-21012", department: "Computer Science & Engineering", session: "2021-22", gender: "Female", hallId: "akbh", hallName: "Alema Khatun Bhashani Hall", residentStatus: "Permanent Resident", roomNo: "201", seatNo: "A", phone: "+8801822334455", walletBalance: 520, bloodGroup: "A+", homeDistrict: "Chittagong" },
        { id: "USR-S03", email: "guest.student@mbstu.acu.bd", password: "guest123", role: "student", name: "Rahim Chowdhury", studentId: "TE-22008", department: "Textile Engineering", session: "2022-23", gender: "Male", hallId: "jamh", hallName: "Jananeta Abdul Mannan Hall", residentStatus: "Non-Resident", roomNo: "Unallocated", seatNo: "N/A", phone: "+8801933445566", walletBalance: 200, bloodGroup: "B+", homeDistrict: "Tangail" },
        { id: "USR-T01", email: "provost@mbstu.acu.bd", password: "admin123", role: "authority", name: "Prof. Dr. Mohammad Rafiqul Islam", teacherId: "FAC-CSE-014", designation: "Provost & Professor", hallId: "safh", hallName: "Shaheed Abrar Fahad Hall", department: "Computer Science & Engineering", gender: "Male", phone: "+8801712345678" }
      ],
      mealSettings: {
        Morning: { name: "Morning Breakfast", code: "morning", residentPrice: 25, nonResidentPrice: 35, cutoffTime: "07:00", diningTime: "07:30 AM - 09:30 AM", menuDescription: "Paratha (3 pcs) / Bhuna Khichuri, Fried Egg / Mixed Vegetables, Hot Milk Tea" },
        Noon: { name: "Noon Lunch", code: "noon", residentPrice: 50, nonResidentPrice: 70, cutoffTime: "11:30", diningTime: "01:00 PM - 03:00 PM", menuDescription: "Steamed Rice, Fresh Rui Fish / Chicken Curry, Lentil Daal, Garden Salad" },
        Night: { name: "Night Dinner", code: "night", residentPrice: 55, nonResidentPrice: 75, cutoffTime: "18:30", diningTime: "08:00 PM - 10:00 PM", menuDescription: "Aromatic Rice, Beef Kala Bhuna / Boiled Egg Curry, Mixed Vegetables, Daal" }
      },
      mealTokens: [],
      seatApplications: [],
      notices: [],
      complaints: []
    };
  }
};

// Initialize DB immediately
DB.init();
