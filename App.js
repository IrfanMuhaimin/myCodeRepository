import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useState, useEffect } from 'react';

//Import To-Do List Dependencies
import React from 'react';
import {
  FlatList, TouchableOpacity, Modal,
  TouchableWithoutFeedback
} from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import Ionicons from '@expo/vector-icons/Ionicons';

//initialize the database
const initializeDatabase = async(db) => {
    try {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                done INTEGER DEFAULT 0  -- 0 for false, 1 for true
            );
        `);
        console.log(db);
        console.log('Database initialized !');
    } catch (error) {
        console.log('Error while initializing the database : ', error);
    }
};

//create a stack navigator that manages the navigation between 3 screens
const Stack = createStackNavigator();

//We'll have 3 screens : Login, Register, Home, and Todo

export default function App() {
  return (
    <SQLiteProvider databaseName='auth.db' onInit={initializeDatabase}>
        <NavigationContainer>
            <Stack.Navigator initialRouteName='Login'>
                <Stack.Screen name='Login' component={LoginScreen}/>
                <Stack.Screen name='Register' component={RegisterScreen}/>
                <Stack.Screen name='Home' component={HomeScreen}/>
                <Stack.Screen name='Todo' component={TodoScreen}/>
            </Stack.Navigator>
        </NavigationContainer>
    </SQLiteProvider>
  );
}

//LoginScreen component
const LoginScreen = ({navigation}) => {

    const db = useSQLiteContext();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Loading state

    //function to handle login logic
    const handleLogin = async() => {
        if(userName.length === 0 || password.length === 0) {
            Alert.alert('Attention','Please enter both username and password');
            return;
        }

        setIsLoading(true); // Start loading
        try {
            const user = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [userName]);
            if (!user) {
                Alert.alert('Error', 'Username does not exist !');
                return;
            }

            const validUser = await db.getFirstAsync('SELECT * FROM users WHERE username = ? AND password = ?', [userName, password]);
            if(validUser) {
                Alert.alert('Success', 'Login successful');
                navigation.navigate('Home', {user:userName});
                setUserName('');
                setPassword('');
            } else {
                Alert.alert('Error', 'Incorrect password');
            }
        } catch (error) {
            console.log('Error during login : ', error);
        } finally {
            setIsLoading(false); // Stop loading
        }
    }
    return (
         <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
        >
            <Text style={styles.title}>Login</Text>
            <TextInput 
                style={styles.input}
                placeholder='Username'
                value={userName}
                onChangeText={setUserName}
            />
            <TextInput 
                style={styles.input}
                placeholder='Password'
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
             {isLoading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : (
            <Pressable style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText} >Login</Text>
            </Pressable>
            )}

            <Pressable style={styles.link} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Don't have an account? Register</Text>
            </Pressable>
        </KeyboardAvoidingView>
    )
}

//RegisterScreenComponent
const RegisterScreen = ({navigation}) => {

    const db = useSQLiteContext();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    //function to handle registration logic
    const handleRegister = async() => {
        if  (userName.length === 0 || password.length === 0 || confirmPassword.length === 0) {
            Alert.alert('Attention!', 'Please enter all the fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Password do not match');
            return;
        }

        setIsLoading(true);
        try {
            const existingUser = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [userName]);
            if (existingUser) {
                Alert.alert('Error', 'Username already exists.');
                return;
            }

            await db.runAsync('INSERT INTO users (username, password) VALUES (?, ?)', [userName, password]);
            Alert.alert('Success', 'Registration successful!');
            navigation.navigate('Login');

        } catch (error) {
            console.log('Error during registration : ', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
        >
            <Text style={styles.title}>Register</Text>
            <TextInput 
                style={styles.input}
                placeholder='Username'
                value={userName}
                onChangeText={setUserName}
            />
            <TextInput 
                style={styles.input}
                placeholder='Password'
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput 
                style={styles.input}
                placeholder='Confirm password'
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            {isLoading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : (
            <Pressable style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText} >Register</Text>
            </Pressable>
            )}
            <Pressable style={styles.link} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Already have an account? Login</Text>
            </Pressable>
        </KeyboardAvoidingView>
    )
}

//HomeScreen component
const HomeScreen = ({navigation, route}) => {

    //we'll extract the user parameter from route.params
    const { user } = route.params;

    const goToTodo = () => {
        navigation.navigate('Todo'); // Navigate to the TodoScreen
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home</Text>
            <Text style={styles.userText}>Welcome {user} !</Text>
            <Pressable style={styles.button} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttonText}>Logout</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={goToTodo}>
                <Text style={styles.buttonText}>Go to To-Do List</Text>
            </Pressable>

            <StatusBar style="auto" />
        </View>
    )
}

//TodoScreen Component
const TodoScreen = () => {
    const db = useSQLiteContext();

    // To-Do List State and Functions (Copied from your To-Do List component)
    const [items, setItems] = useState([]); //store list to-do
    const [inputValue, setInputValue] = useState(''); //store input value
    const [modalVisible, setModalVisible] = useState(false); //control visibility add task modal
    const [editIndex, setEditIndex] = useState(null); //track task edited
    const [editValue, setEditValue] = useState(''); //hold updated text when edit
    const [lastTap, setLastTap] = useState(null); //keep track last tap time to detect double tap

    // Load tasks from the database on component mount
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const taskData = await db.getAllAsync('SELECT * FROM tasks');
                // Convert 'done' values from 0/1 to boolean
                const tasks = taskData.map(task => ({ ...task, done: task.done === 1 }));
                setItems(tasks);
            } catch (error) {
                console.log('Error loading tasks: ', error);
                Alert.alert('Error', 'Failed to load tasks from the database.');
            }
        };

        loadTasks();
    }, []);

    //add item function
    const addItem = async () => {
        if (inputValue.trim()) { //prevent empty task
            try {
                await db.runAsync('INSERT INTO tasks (title) VALUES (?)', [inputValue]);
                // After inserting, fetch the new task list
                const taskData = await db.getAllAsync('SELECT * FROM tasks');
                const tasks = taskData.map(task => ({ ...task, done: task.done === 1 }));
                 setItems(tasks);
                setInputValue(''); //clear input field
                setModalVisible(false); //hide modal after task added

            } catch (error) {
                console.log('Error adding task: ', error);
                Alert.alert('Error', 'Failed to add task.');
            }

        } else {
            Alert.alert('Please enter a task title'); //avoid empty space (popup notification)
        }
    };

    //delete function
    const deleteItem = async (index) => {
        try {
            // Get the ID of the task to delete
            const taskId = items[index].id;
            await db.runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);

            // Fetch the updated task list
            const taskData = await db.getAllAsync('SELECT * FROM tasks');
            const tasks = taskData.map(task => ({ ...task, done: task.done === 1 }));
             setItems(tasks);

        } catch (error) {
            console.log('Error deleting task: ', error);
            Alert.alert('Error', 'Failed to delete task.');
        }
    };

    //toggle done state checkbox
    const toggleDone = async (index) => {
        try {
            const taskId = items[index].id;
            const newDoneStatus = items[index].done ? 0 : 1; // Toggle 0/1 for SQLite

            await db.runAsync('UPDATE tasks SET done = ? WHERE id = ?', [newDoneStatus, taskId]);

            // Fetch the updated task list
             const taskData = await db.getAllAsync('SELECT * FROM tasks');
             const tasks = taskData.map(task => ({ ...task, done: task.done === 1 }));
             setItems(tasks);


        } catch (error) {
            console.log('Error toggling task status: ', error);
            Alert.alert('Error', 'Failed to update task status.');
        }
    };

    //edit task function
    const handleEdit = (index) => {
        setEditIndex(index); //store index task edited
        setEditValue(items[index].title); //fill input with existing task
    };

    //save edited task
    const saveEdit = async () => {
        if (editValue.trim() && editIndex !== null) { //check input not empty
            try {
                const taskId = items[editIndex].id;
                await db.runAsync('UPDATE tasks SET title = ? WHERE id = ?', [editValue, taskId]);

                const taskData = await db.getAllAsync('SELECT * FROM tasks');
                const tasks = taskData.map(task => ({ ...task, done: task.done === 1 }));
                setItems(tasks);

            } catch (error) {
                console.log('Error saving edit: ', error);
                Alert.alert('Error', 'Failed to save edit.');
            }
        }
        setEditIndex(null); //exit editing
    };

    // Detect double tap for editing
    const handleDoubleTap = (index) => {
        const now = Date.now(); //capture current time
        if (lastTap && now - lastTap < 300) { //consider as double tap when second tap in 300ms
            handleEdit(index); //call edit function
        }
        setLastTap(now); //update last tap
    };

    // Long press for 2 seconds to edit
    const handleLongPress = (index) => {
        setTimeout(() => {
            handleEdit(index); //call edit function
        }, 2000); //hold exceed 2000ms
    };

    return (
        <TouchableWithoutFeedback onPress={saveEdit}>
            <View style={styles.container}>
                <Text style={styles.title}>To-Do App</Text>
                <View style={styles.underline} />

                <View style={styles.subtitleContainer}>
                    <Text style={styles.subtitle}>Checklist</Text>
                     <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                         <Ionicons name="add-circle-outline" size={24} color="white" />
                         <Text style={styles.addButtonText}>Add</Text>
                     </TouchableOpacity>
                 </View>

                <FlatList //render task list
                    data={items}
                    keyExtractor={(item) => item.id.toString()} // Use the id from the database
                    renderItem={({ item, index }) => (//task display UI
                        <TouchableOpacity
                            onPress={() => handleDoubleTap(index)} //double tap to edit
                            onLongPress={() => handleLongPress(index)} //long press to edit
                        >
                            <View style={styles.itemContainer}>
                               {editIndex === index ? ( //task container layout
                                  <TextInput
                                      style={styles.input}
                                      value={editValue}
                                      onChangeText={setEditValue}
                                      autoFocus
                                  />
                              ) : (
                                  <Text style={styles.itemText}>{index + 1}. {item.title}</Text> //display task info
                              )}
                                <View style={styles.actionContainer}>
                                    <TouchableOpacity onPress={() => toggleDone(index)} style={styles.checkbox}>
                                        {item.done ? <Text style={styles.checkboxText}>☑️</Text> : <Text style={styles.checkboxText}>☐</Text>}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteItem(index)} style={styles.deleteButton}>
                                        <Octicons name="no-entry" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />

                <Modal //pop-up when add new item
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)} //control back button
                >
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalView}>
                                    <Text style={styles.modalText}>Add New Task</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Task Title"
                                        value={inputValue}
                                        onChangeText={setInputValue}
                                    />
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity style={styles.addButton} onPress={addItem}>
                                            <Text style={styles.addButtonText}>Add</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <StatusBar style="auto" />
            </View>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'flex-start',  // Align items at the top
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    input: {
      width: '80%',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      marginVertical: 5,
    },
    button: {
      backgroundColor: 'blue',
      padding: 10,
      marginVertical: 10,
      width: '80%',
      borderRadius: 5,
    },
    buttonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: 18,
    },
    link: {
      marginTop: 10,
    },
    linkText: {
      color: 'blue',
    },
    userText: {
      fontSize: 18,
      marginBottom: 10, // Reduced margin
    },
  
    // Styles for the To-Do List Container
    todoListContainer: {
        width: '100%', // Adjust width as needed (e.g., 80% of the screen)
        marginBottom: 20, // Add margin below the To-Do list
        padding: 15, // Add some padding around the To-Do list
        backgroundColor: '#f0f0f0', // Light background color
        borderRadius: 10, // Rounded corners
        alignItems: 'flex-start', // Center content horizontally within the container
        height: 100, //fixed height
    },
    todoListTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
  
    //To-do list style
    underline: {
      height: 1,
      backgroundColor: '#000',
      width: '100%',
      marginBottom: 10 // Reduced margin
     },
   subtitleContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 10, // Reduced margin
     padding: 10,
     width: '100%'//take all width
   },
   subtitle: {
     fontSize: 18,
     fontWeight: 'bold',
     textAlign: 'left'
   },
   itemContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     //justifyContent: 'space-between',   // Remove this line
     padding: 10, // Reduced padding
     borderWidth: 1.5,
     borderColor: 'black',
     marginBottom: 5, // Reduced margin
      width: '100%'//take all width
   },
   taskInfoContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,  // Make the task info container occupy the available space
         width: '70%', //set width here and reduce
   },
   itemText: {
      fontSize: 16, // Reduced font size
     //flex: 1  //Remove this one
     flexShrink: 1, //Ensure the text shrink when it is too long
     wordWrap: 'break-word',// break if words are too long
     },
   done: {  //tonggle checkbox
     textDecorationLine: 'line-through',
     color: 'grey'
   },
   actionContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     //marginLeft: 'auto' // Push action items to the right
    width: '60%', //take smaller size
    justifyContent: 'flex-end',//all item on the right side
   },
   checkbox: {
     marginRight: 3 // Reduced margin and smaller gap
   },
   checkboxText: {
     fontSize: 20 // Reduced font size
   },
   deleteButton: {
     backgroundColor: 'red',
     padding: 3, // Reduced padding
     borderRadius: 50,
      marginLeft: 3 // Smaller gap
   },
   modalOverlay: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(0, 0, 0, 0.5)'
   },
   modalView: {
     width: '80%',
     backgroundColor: 'white',
     borderRadius: 10,
     padding: 15, // Reduced padding
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 4,
     elevation: 5
   },
   modalText: {
     marginBottom: 10, // Reduced margin
     textAlign: 'center',
     fontSize: 18 // Reduced font size
   },
   input: {
     borderWidth: 1,
     borderColor: '#ccc',
     padding: 8, // Reduced padding
     marginBottom: 10, // Reduced margin
     width: '100%',
     borderRadius: 5,
     fontSize: 16 // Reduced font size
   },
   buttonContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     width: '100%'
   },
   addButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'blue',
     padding: 8, // Reduced padding
     paddingHorizontal: 16, // Reduced horizontal padding
     borderRadius: 10,
     justifyContent: 'center'
   },
   addButtonText: {
     color: 'white',
     fontWeight: 'bold',
     fontSize: 16 // Reduced font size
   },
   cancelButton: {
     backgroundColor: 'red',
     padding: 8, // Reduced padding
     borderRadius: 10,
     paddingHorizontal: 16, // Reduced horizontal padding
     alignItems: 'center',
     justifyContent: 'center'
   },
   cancelButtonText: {
     color: 'white',
     fontWeight: 'bold',
     fontSize: 16 // Reduced font size
   },
  });