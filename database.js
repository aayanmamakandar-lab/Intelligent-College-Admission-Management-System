class IntelligentCollegeDatabase {
    constructor() {
        this.dbName = 'IntelligentCollege_Admission_System';
        // bump DB version to add new stores (streams)
        this.version = 2;
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    // Initialize database
    async init() {
        try {
            this.db = await this.openDatabase();
            this.isInitialized = true;
            console.log('IntelligentCollege Database initialized successfully');
            this.updateDatabaseStatus('connected');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.updateDatabaseStatus('error');
        }
    }

    // Open IndexedDB database
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('applications')) {
                    const applicationsStore = db.createObjectStore('applications', { keyPath: 'id', autoIncrement: true });
                    applicationsStore.createIndex('studentId', 'studentId', { unique: false });
                    applicationsStore.createIndex('status', 'status', { unique: false });
                    applicationsStore.createIndex('stream', 'stream', { unique: false });
                    applicationsStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('documents')) {
                    const documentsStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                    documentsStore.createIndex('applicationId', 'applicationId', { unique: false });
                    documentsStore.createIndex('type', 'type', { unique: false });
                    documentsStore.createIndex('status', 'status', { unique: false });
                    documentsStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                }

                if (!db.objectStoreNames.contains('students')) {
                    const studentsStore = db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
                    studentsStore.createIndex('email', 'email', { unique: true });
                    studentsStore.createIndex('phone', 'phone', { unique: false });
                    studentsStore.createIndex('registrationDate', 'registrationDate', { unique: false });
                }

                if (!db.objectStoreNames.contains('meritlists')) {
                    const meritStore = db.createObjectStore('meritlists', { keyPath: 'id', autoIncrement: true });
                    meritStore.createIndex('stream', 'stream', { unique: false });
                    meritStore.createIndex('year', 'year', { unique: false });
                    meritStore.createIndex('rank', 'rank', { unique: false });
                }

                if (!db.objectStoreNames.contains('analytics')) {
                    const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
                    analyticsStore.createIndex('metric', 'metric', { unique: false });
                    analyticsStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('notifications')) {
                    const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                    notificationsStore.createIndex('studentId', 'studentId', { unique: false });
                    notificationsStore.createIndex('type', 'type', { unique: false });
                    notificationsStore.createIndex('date', 'date', { unique: false });
                    notificationsStore.createIndex('read', 'read', { unique: false });
                }

                // Streams store: list of available engineering/academic streams
                if (!db.objectStoreNames.contains('streams')) {
                    const streamsStore = db.createObjectStore('streams', { keyPath: 'id', autoIncrement: true });
                    streamsStore.createIndex('name', 'name', { unique: true });
                    streamsStore.createIndex('code', 'code', { unique: false });
                    streamsStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    // Update database status indicator
    updateDatabaseStatus(status) {
        const indicator = document.querySelector('.database-indicator');
        if (!indicator) return;

        switch(status) {
            case 'connected':
                indicator.innerHTML = `
                    <div class="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="text-sm font-medium">Intelligent college Database Connected</span>
                    </div>
                `;
                break;
            case 'error':
                indicator.innerHTML = `
                    <div class="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <div class="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span class="text-sm font-medium">Database Error</span>
                    </div>
                `;
                break;
            case 'syncing':
                indicator.innerHTML = `
                    <div class="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span class="text-sm font-medium">Syncing Database</span>
                    </div>
                `;
                break;
        }
    }

    // Generic database operations
    async addRecord(storeName, data) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getRecord(storeName, id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAllRecords(storeName, index = null, value = null) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (index && value !== null) {
                const indexObj = store.index(index);
                request = indexObj.getAll(value);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async updateRecord(storeName, data) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async deleteRecord(storeName, id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Application-specific methods
    async createApplication(applicationData) {
        const application = {
            ...applicationData,
            id: this.generateId(),
            date: new Date().toISOString(),
            status: 'pending',
            collegeId: this.generateCollegeId()
        };

        try {
            const appId = await this.addRecord('applications', application);
            
            // Create notification
            await this.createNotification({
                studentId: application.studentId,
                type: 'application_submitted',
                message: 'Your Intelligent college application has been submitted successfully',
                date: new Date().toISOString(),
                read: false
            });

            return { success: true, id: appId, collegeId: application.collegeId };
        } catch (error) {
            console.error('Error creating application:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadDocument(documentData) {
        const document = {
            ...documentData,
            id: this.generateId(),
            uploadDate: new Date().toISOString(),
            status: 'pending',
            verificationDate: null,
            verifiedBy: null,
            comments: []
        };

        try {
            const docId = await this.addRecord('documents', document);
            
            // Create notification
            await this.createNotification({
                studentId: documentData.studentId,
                type: 'document_uploaded',
                message: `Document ${documentData.type} uploaded successfully`,
                date: new Date().toISOString(),
                read: false
            });

            return { success: true, id: docId };
        } catch (error) {
            console.error('Error uploading document:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyDocument(docId, adminId, comments = '') {
        try {
            const document = await this.getRecord('documents', docId);
            if (!document) {
                throw new Error('Document not found');
            }

            document.status = 'verified';
            document.verificationDate = new Date().toISOString();
            document.verifiedBy = adminId;
            document.comments.push({
                adminId,
                comment: comments,
                date: new Date().toISOString()
            });

            await this.updateRecord('documents', document);

            // Create notification
            await this.createNotification({
                studentId: document.studentId,
                type: 'document_verified',
                message: `Document ${document.type} has been verified`,
                date: new Date().toISOString(),
                read: false
            });

            return { success: true };
        } catch (error) {
            console.error('Error verifying document:', error);
            return { success: false, error: error.message };
        }
    }

    // Student management
    async registerStudent(studentData) {
        const student = {
            ...studentData,
            id: this.generateId(),
            registrationDate: new Date().toISOString(),
            collegeId: this.generateCollegeId(),
            status: 'active',
            lastLogin: null,
            preferences: {
                notifications: true,
                language: 'en',
                theme: 'light'
            }
        };

        try {
            const studentId = await this.addRecord('students', student);
            return { success: true, id: studentId, collegeId: student.collegeId };
        } catch (error) {
            console.error('Error registering student:', error);
            return { success: false, error: error.message };
        }
    }

    // Notification system
    async createNotification(notificationData) {
        const notification = {
            ...notificationData,
            id: this.generateId(),
            date: new Date().toISOString()
        };

        try {
            await this.addRecord('notifications', notification);
            this.updateNotificationBadge();
            return { success: true };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }
    }

    async getUnreadNotifications(studentId) {
        try {
            const notifications = await this.getAllRecords('notifications', 'studentId', studentId);
            return notifications.filter(n => !n.read);
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const notification = await this.getRecord('notifications', notificationId);
            if (notification) {
                notification.read = true;
                await this.updateRecord('notifications', notification);
                this.updateNotificationBadge();
            }
            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            // Simulate getting unread count
            const unreadCount = Math.floor(Math.random() * 5) + 1;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    // Analytics methods
    async getAnalyticsData(metric, dateRange = null) {
        try {
            const analytics = await this.getAllRecords('analytics', 'metric', metric);
            
            if (dateRange) {
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                return analytics.filter(a => {
                    const date = new Date(a.date);
                    return date >= startDate && date <= endDate;
                });
            }
            
            return analytics;
        } catch (error) {
            console.error('Error getting analytics:', error);
            return [];
        }
    }

    async updateAnalytics(metric, data) {
        const analyticsData = {
            id: this.generateId(),
            metric,
            data,
            date: new Date().toISOString()
        };

        try {
            await this.addRecord('analytics', analyticsData);
            return { success: true };
        } catch (error) {
            console.error('Error updating analytics:', error);
            return { success: false, error: error.message };
        }
    }

    // Streams management
    async addStream(streamData) {
        const stream = {
            id: this.generateId(),
            name: streamData.name,
            code: streamData.code || null,
            createdAt: new Date().toISOString()
        };

        try {
            const id = await this.addRecord('streams', stream);
            return { success: true, id };
        } catch (error) {
            console.error('Error adding stream:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllStreams() {
        try {
            const streams = await this.getAllRecords('streams');
            return streams;
        } catch (error) {
            console.error('Error getting streams:', error);
            return [];
        }
    }

    async deleteStream(streamId) {
        try {
            await this.deleteRecord('streams', streamId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting stream:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateCollegeId() {
        const year = new Date().getFullYear();
        const serial = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `IC${year}${serial}`;
    }

    // Data export/import
    async exportData() {
        try {
            const data = {
                applications: await this.getAllRecords('applications'),
                documents: await this.getAllRecords('documents'),
                students: await this.getAllRecords('students'),
                notifications: await this.getAllRecords('notifications'),
                exportDate: new Date().toISOString()
            };
            
            return { success: true, data };
        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }

    async importData(data) {
        try {
            this.updateDatabaseStatus('syncing');
            
            // Import data in batches to avoid overwhelming the database
            const batchSize = 50;
            const stores = ['applications', 'documents', 'students', 'notifications'];
            
            for (const storeName of stores) {
                if (data[storeName]) {
                    const records = data[storeName];
                    for (let i = 0; i < records.length; i += batchSize) {
                        const batch = records.slice(i, i + batchSize);
                        for (const record of batch) {
                            await this.addRecord(storeName, record);
                        }
                        // Small delay between batches
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
            
            this.updateDatabaseStatus('connected');
            return { success: true };
        } catch (error) {
            console.error('Error importing data:', error);
            this.updateDatabaseStatus('error');
            return { success: false, error: error.message };
        }
    }

    // Search functionality
    async searchApplications(query) {
        try {
            const applications = await this.getAllRecords('applications');
            const students = await this.getAllRecords('students');
            
            const results = applications.filter(app => {
                const student = students.find(s => s.id === app.studentId);
                if (!student) return false;
                
                const searchText = `${student.name} ${student.email} ${app.stream} ${app.collegeId}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            
            return results;
        } catch (error) {
            console.error('Error searching applications:', error);
            return [];
        }
    }

    // Backup and restore
    async backupDatabase() {
        try {
            const data = await this.exportData();
            const backup = {
                ...data,
                backupDate: new Date().toISOString(),
                version: this.version
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `Intelligent college_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error backing up database:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize global database instance
window.bsoietDB = new IntelligentCollegeDatabase();

// Make database functions globally available
window.uploadDocument = async function(documentData) {
    return await window.bsoietDB.uploadDocument(documentData);
};

window.createApplication = async function(applicationData) {
    return await window.bsoietDB.createApplication(applicationData);
};

window.registerStudent = async function(studentData) {
    return await window.bsoietDB.registerStudent(studentData);
};

window.verifyDocument = async function(docId, adminId, comments) {
    return await window.bsoietDB.verifyDocument(docId, adminId, comments);
};

window.getNotifications = async function(studentId) {
    return await window.bsoietDB.getUnreadNotifications(studentId);
};

window.searchApplications = async function(query) {
    return await window.bsoietDB.searchApplications(query);
};

window.backupDatabase = async function() {
    return await window.bsoietDB.backupDatabase();
};