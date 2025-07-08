document.addEventListener("DOMContentLoaded", () => {
    const threadCountInput = document.getElementById("threadCount");
    const taskDurationInput = document.getElementById("taskDuration");
    const taskPriorityInput = document.getElementById("taskPriority");
    const addTaskBtn = document.getElementById("addTask");
    const startSimulationBtn = document.getElementById("startSimulation");
    const resetBtn = document.getElementById("reset");
    const threadsContainer = document.getElementById("threads");
    const queueContainer = document.getElementById("queue");
    const completedSpan = document.getElementById("completed");
    const pendingSpan = document.getElementById("pending");
    const utilizationSpan = document.getElementById("utilization");

    let threadPool = [];
    let taskQueue = [];
    let completedTasks = 0;
    let isSimulating = false;

    // Initialize Thread Pool
    function initThreadPool(threadCount) {
        threadsContainer.innerHTML = "";
        threadPool = Array(threadCount).fill(null).map((_, i) => ({
            id: i,
            isBusy: false,
            currentTask: null,
            element: null,
            timer: null
        }));

        threadPool.forEach(thread => {
            const threadElement = document.createElement("div");
            threadElement.className = "thread";
            threadElement.innerHTML = `
                <p>Thread ${thread.id + 1}</p>
                <p class="status">Idle</p>
                <div class="thread-busy"></div>
            `;
            threadsContainer.appendChild(threadElement);
            thread.element = threadElement;
        });
    }

    // Add Task
    function addTask() {
        const duration = parseInt(taskDurationInput.value);
        const priority = taskPriorityInput.value;
        const taskId = Date.now() + Math.random(); // ensure uniqueness

        const task = { id: taskId, duration, priority };
        taskQueue.push(task);

        taskQueue.sort((a, b) => {
            const priorityMap = { high: 3, medium: 2, low: 1 };
            return priorityMap[b.priority] - priorityMap[a.priority];
        });

        const taskElement = document.createElement("div");
        taskElement.className = `task ${priority}`;
        taskElement.id = `task-${taskId}`;
        taskElement.textContent = `Task - ${priority.charAt(0).toUpperCase() + priority.slice(1)}`;
        queueContainer.appendChild(taskElement);

        updateStats();
        if (isSimulating) {
            processTasks(); // trigger processing for new tasks added during simulation
        }
    }

    // Start Simulation
    function startSimulation() {
        if (isSimulating) return;
        isSimulating = true;
        processTasks();
    }

    // Process Tasks
    function processTasks() {
        if (!isSimulating) return;

        let activeThreads = 0;

        threadPool.forEach(thread => {
            if (!thread.isBusy && taskQueue.length > 0) {
                const task = taskQueue.shift();
                thread.isBusy = true;
                thread.currentTask = task;

                const taskElement = document.getElementById(`task-${task.id}`);
                if (taskElement) taskElement.remove();

                updateThreadUI(thread, true);

                if (thread.timer) clearTimeout(thread.timer);

                thread.timer = setTimeout(() => {
                    thread.isBusy = false;
                    thread.currentTask = null;
                    completedTasks++;

                    updateThreadUI(thread, false);
                    updateStats();

                    if (isSimulating) {
                        processTasks(); // keep processing next available task
                    }
                }, task.duration);
            }

            if (thread.isBusy) activeThreads++;
        });

        updateStats();
    }

    // Update UI
    function updateThreadUI(thread, isBusy) {
        const statusElement = thread.element.querySelector(".status");
        const busyBar = thread.element.querySelector(".thread-busy");

        if (isBusy) {
            thread.element.classList.add("thread-working");
            statusElement.textContent = `Working (${thread.currentTask.duration}ms)`;
            busyBar.style.transitionDuration = `${thread.currentTask.duration}ms`;
            busyBar.style.width = "100%";
        } else {
            thread.element.classList.remove("thread-working");
            statusElement.textContent = "Idle";
            busyBar.style.width = "0%";
        }
    }

    // Update Stats
    function updateStats() {
        pendingSpan.textContent = taskQueue.length;
        completedSpan.textContent = completedTasks;
        const busyCount = threadPool.filter(t => t.isBusy).length;
        const utilization = threadPool.length === 0 ? 0 : (busyCount / threadPool.length) * 100;
        utilizationSpan.textContent = `${utilization.toFixed(1)}%`;
    }

    // Reset Everything
    function reset() {
        isSimulating = false;
        taskQueue = [];
        completedTasks = 0;

        threadPool.forEach(thread => {
            if (thread.timer) clearTimeout(thread.timer);
        });

        queueContainer.innerHTML = "";
        updateStats();
        initThreadPool(parseInt(threadCountInput.value));
    }

    // Events
    threadCountInput.addEventListener("change", () => {
        reset();
    });

    addTaskBtn.addEventListener("click", addTask);
    startSimulationBtn.addEventListener("click", startSimulation);
    resetBtn.addEventListener("click", reset);

    // Initial Setup
    initThreadPool(parseInt(threadCountInput.value));
});
