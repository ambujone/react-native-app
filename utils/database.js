import * as SQLite from 'expo-sqlite';

// Open the database - handle different versions of expo-sqlite
let db;
try {
  // For newer versions of expo-sqlite
  if (SQLite.openDatabaseSync) {
    db = SQLite.openDatabaseSync('little_lemon.db');
  }
  // For older versions of expo-sqlite
  else if (SQLite.default && SQLite.default.openDatabase) {
    db = SQLite.default.openDatabase('little_lemon.db');
  }
  // Fallback to direct import
  else if (SQLite.openDatabase) {
    db = SQLite.openDatabase('little_lemon.db');
  }
  else {
    console.error('SQLite methods not found. Available methods:', Object.keys(SQLite));
    throw new Error('SQLite not properly initialized');
  }
  console.log('SQLite database opened successfully');
} catch (error) {
  console.error('Error opening SQLite database:', error);
  // Create a mock database for fallback
  db = {
    transaction: (callback, errorCallback, successCallback) => {
      console.warn('Using mock database - SQLite not available');

      // Create a mock transaction object
      const mockTx = {
        executeSql: (query, params, successCb, errorCb) => {
          console.warn('Mock SQL execution:', query);

          // For SELECT queries, return empty array
          if (query.trim().toUpperCase().startsWith('SELECT')) {
            successCb(mockTx, { rows: { _array: [] } });
          }
          // For other queries, just succeed
          else {
            successCb(mockTx, { rowsAffected: 0 });
          }
        }
      };

      // Call the transaction callback with our mock transaction
      try {
        callback(mockTx);
        if (successCallback) successCallback();
      } catch (error) {
        console.error('Error in mock transaction:', error);
        if (errorCallback) errorCallback(error);
      }
    }
  };
}

/**
 * Initialize the database by creating the necessary tables
 * @returns {Promise<void>}
 */
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Create menu table if it doesn't exist
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS menu (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image TEXT,
            category TEXT
          );`,
          [],
          () => {
            console.log('Database initialized successfully');
            resolve();
          },
          (_, error) => {
            console.error('Error creating table:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
};

/**
 * Check if the menu table has data
 * @returns {Promise<boolean>} True if data exists, false otherwise
 */
export const hasMenuData = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM menu;',
          [],
          (_, { rows }) => {
            const count = rows._array[0].count;
            resolve(count > 0);
          },
          (_, error) => {
            console.error('Error checking for menu data:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
};

/**
 * Save menu items to the database
 * @param {Array} menuItems - Array of menu items to save
 * @returns {Promise<void>}
 */
export const saveMenuItems = (menuItems) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Clear existing data
        tx.executeSql(
          'DELETE FROM menu;',
          [],
          () => {
            console.log('Cleared existing menu data');
          },
          (_, error) => {
            console.error('Error clearing menu data:', error);
            reject(error);
            return false;
          }
        );

        // Insert new data
        menuItems.forEach((item) => {
          tx.executeSql(
            'INSERT INTO menu (id, name, description, price, image, category) VALUES (?, ?, ?, ?, ?, ?);',
            [
              item.id,
              item.name,
              item.description,
              item.price,
              item.image,
              item.category,
            ],
            () => {
              console.log(`Inserted item: ${item.name}`);
            },
            (_, error) => {
              console.error(`Error inserting item ${item.name}:`, error);
              reject(error);
              return false;
            }
          );
        });
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      },
      () => {
        console.log('All menu items saved successfully');
        resolve();
      }
    );
  });
};

/**
 * Get all menu items from the database
 * @returns {Promise<Array>} Array of menu items
 */
export const getMenuItems = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT * FROM menu;',
          [],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            console.error('Error getting menu items:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
};

/**
 * Get all unique categories from the database
 * @returns {Promise<Array>} Array of unique categories
 */
export const getCategories = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT DISTINCT category FROM menu WHERE category IS NOT NULL;',
          [],
          (_, { rows }) => {
            // Extract category names from the result
            const categories = rows._array.map(item => item.category);
            resolve(categories);
          },
          (_, error) => {
            console.error('Error getting categories:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
};

/**
 * Filter menu items by categories and search text
 * @param {Array} categories - Array of categories to filter by (empty array means no category filter)
 * @param {string} searchText - Text to search for in dish names (empty string means no text filter)
 * @returns {Promise<Array>} Array of filtered menu items
 */
export const filterMenuItems = (categories = [], searchText = '') => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        let query = 'SELECT * FROM menu';
        const params = [];

        // Build WHERE clause based on filters
        const conditions = [];

        // Add category filter if categories are provided
        if (categories.length > 0) {
          const placeholders = categories.map(() => '?').join(',');
          conditions.push(`category IN (${placeholders})`);
          params.push(...categories);
        }

        // Add search text filter if provided
        if (searchText.trim() !== '') {
          conditions.push(`name LIKE ?`);
          params.push(`%${searchText}%`);
        }

        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Add ORDER BY clause
        query += ' ORDER BY name;';

        console.log('SQL Query:', query);
        console.log('SQL Params:', params);

        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            console.error('Error filtering menu items:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
};
