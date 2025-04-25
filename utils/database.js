import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabase('little_lemon.db');

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
