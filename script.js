document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const totalTasksSpan = document.getElementById('total-tasks');
    const completedTasksSpan = document.getElementById('completed-tasks');
    const themeSwitch = document.getElementById('theme-switch');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let draggedItem = null;

    // Initialize
    initTheme();
    renderTasks();
    updateStats();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    clearAllBtn.addEventListener('click', clearAllTasks);
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => filterTasks(btn.dataset.filter));
    });
    themeSwitch.addEventListener('change', toggleTheme);

    // Drag and Drop Events
    taskList.addEventListener('dragstart', handleDragStart);
    taskList.addEventListener('dragover', handleDragOver);
    taskList.addEventListener('drop', handleDrop);
    taskList.addEventListener('dragend', handleDragEnd);

    // Functions
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSwitch.checked = savedTheme === 'dark';
    }

    function toggleTheme() {
        const theme = themeSwitch.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') {
            showError('Please enter a task');
            return;
        }

        const newTask = {
            id: Date.now(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        taskInput.value = '';
        taskInput.focus();
    }

    function renderTasks() {
        taskList.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = currentFilter === 'all' 
                ? 'No tasks yet. Add one above!' 
                : currentFilter === 'active' 
                    ? 'No active tasks' 
                    : 'No completed tasks';
            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.draggable = true;
            taskItem.dataset.id = task.id;

            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <div class="task-actions">
                    <button class="task-edit"><i class="fas fa-edit"></i></button>
                    <button class="task-delete"><i class="fas fa-trash"></i></button>
                </div>
            `;

            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.task-edit');
            const deleteBtn = taskItem.querySelector('.task-delete');
            const taskText = taskItem.querySelector('.task-text');

            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            editBtn.addEventListener('click', () => editTask(task.id, taskText));

            taskList.appendChild(taskItem);
        });
    }

    function toggleTaskCompletion(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        updateStats();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }

    function editTask(id, taskTextElement) {
        const currentText = taskTextElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';
        
        taskTextElement.replaceWith(input);
        input.focus();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                tasks = tasks.map(task => 
                    task.id === id ? { ...task, text: newText } : task
                );
                saveTasks();
            }
            renderTasks();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });
    }

    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }

    function clearAllTasks() {
        if (tasks.length === 0 || !confirm('Are you sure you want to delete all tasks?')) return;
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
    }

    function filterTasks(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        renderTasks();
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        
        totalTasksSpan.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
        completedTasksSpan.textContent = `${completed} completed`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        
        document.body.appendChild(error);
        setTimeout(() => {
            error.classList.add('fade-out');
            setTimeout(() => error.remove(), 500);
        }, 2000);
    }

    // Drag and Drop Functions
    function handleDragStart(e) {
        if (!e.target.classList.contains('task-item')) return;
        
        draggedItem = e.target;
        e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
        setTimeout(() => {
            draggedItem.classList.add('dragging');
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        const targetItem = e.target.closest('.task-item');
        if (!targetItem || targetItem === draggedItem) return;
        
        const boundingBox = targetItem.getBoundingClientRect();
        const offset = boundingBox.y + boundingBox.height / 2;
        
        if (e.clientY < offset) {
            taskList.insertBefore(draggedItem, targetItem);
        } else {
            taskList.insertBefore(draggedItem, targetItem.nextSibling);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        if (!draggedItem) return;
        
        // Update tasks array based on new order
        const newTasks = [];
        const taskElements = taskList.querySelectorAll('.task-item');
        
        taskElements.forEach(element => {
            const taskId = parseInt(element.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            if (task) newTasks.push(task);
        });
        
        tasks = newTasks;
        saveTasks();
    }

    function handleDragEnd() {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    }
});