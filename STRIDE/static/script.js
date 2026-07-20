// ========================================================= //
// STRIDE — front-end interactivity
// ========================================================= //
document.addEventListener("DOMContentLoaded", () => {
  initTaskModal();
  initFilterChips();
  initTaskCheck();
  initTaskMenusEngine();
  initThemeEngine();
});

// --------------------------------------------------------- //
// SpongeBob Trigger Engine
// --------------------------------------------------------- //
function triggerTaskTerminatedAnimation() {
  const container = document.createElement('div');
  container.className = 'stride-spongebob-container';
  container.innerHTML = `
        <div class="spongebob-wrapper">
            <img src="/static/images/spongebob_rainbow.png" alt="SpongeBob" class="spongebob-gif">
            <div class="rainbow-text-wrapper">
                <span class="rainbow-text">Ta-daaaa!</span>
            </div>
        </div>
    `;
  document.body.appendChild(container);
  setTimeout(() => {
    container.remove();
  }, 12000);
}

// --------------------------------------------------------- //
// Add-task modal
// --------------------------------------------------------- //
function initTaskModal() {
  const modal = document.getElementById("taskModal");
  if (!modal) return;

  const openers = [
    document.getElementById("openAddTask"),
    document.getElementById("openAddTaskEmpty"),
  ].filter(Boolean);
  const closeBtn = document.getElementById("closeAddTask");

  openers.forEach((btn) =>
    btn.addEventListener("click", () => {
      modal.classList.add("open");
      const firstField = modal.querySelector("input, textarea");
      if (firstField) firstField.focus();
    })
  );

  const close = () => modal.classList.remove("open");
  if (closeBtn) closeBtn.addEventListener("click", close);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });
}

// --------------------------------------------------------- //
// Filter chips — client-side show/hide, no reload needed
// --------------------------------------------------------- //
function initFilterChips() {
  const chips = document.querySelectorAll(".filter-chip");
  const rows = document.querySelectorAll(".task-row");
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.dataset.filter;
      rows.forEach((row) => {
        const match = filter === "all" || row.dataset.status === filter;
        row.style.display = match ? "" : "none";
      });
    });
  });
}

// --------------------------------------------------------- //
// Task complete toggle — optimistic UI update
// --------------------------------------------------------- //
function initTaskCheck() {
  document.querySelectorAll(".task-check").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".task-row");
      const taskId = row.dataset.taskId;
      const willBeDone = !btn.classList.contains("checked");

      btn.classList.toggle("checked", willBeDone);
      row.classList.toggle("is-done", willBeDone);
      row.dataset.status = willBeDone ? "completed" : "pending";

      try {
        const res = await fetch(`/tasks/${taskId}/toggle`, { method: "POST" });
        if (!res.ok) throw new Error("Request failed");
        updateStrideBar();
      } catch (err) {
        btn.classList.toggle("checked", !willBeDone);
        row.classList.toggle("is-done", !willBeDone);
        row.dataset.status = !willBeDone ? "completed" : "pending";
        console.error("Couldn't update task:", err);
      }
    });
  });
}

function updateStrideBar() {
  const rows = document.querySelectorAll(".task-row");
  const total = rows.length;
  const done = document.querySelectorAll(".task-row.is-done").length;

  const highPriorityCount = Array.from(rows).filter(row => row.dataset.priority === "high").length;
  const pendingCount = Array.from(rows).filter(row => row.dataset.status !== "completed").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const countEl = document.getElementById("strideCount");
  if (countEl) countEl.textContent = `${done} / ${total} done`;

  const steps = document.querySelectorAll(".stride-step");
  steps.forEach((step, i) => {
    step.classList.toggle("done", i < done);
  });

  const totalHeaderEl = document.querySelector(".your-tasks-container span, .total-counter-text");
  if (totalHeaderEl) totalHeaderEl.textContent = `${total} total`;

  const completionRateEl = document.getElementById("dashboardCompletionRate");
  if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;

  const highPriorityEl = document.getElementById("dashboardHighPriority");
  if (highPriorityEl) highPriorityEl.textContent = highPriorityCount;

  const pendingActionEl = document.getElementById("dashboardPendingAction");
  if (pendingActionEl) pendingActionEl.textContent = pendingCount;
}

// --------------------------------------------------------- //
// Task context action menu handler
// --------------------------------------------------------- //
function initTaskMenusEngine() {
  // 1. Toggle Dropdown Menu Open/Close
  document.querySelectorAll(".task-menu-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".dropdown-menu").forEach(m => m.classList.remove("show"));
      const menu = btn.nextElementSibling;
      if (menu) menu.classList.toggle("show");
    });
  });

  // Close menus on clicking elsewhere
  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.classList.remove("show"));
  });

  // 2. Click Handler for Deletion Triggers
  document.querySelectorAll(".delete-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault(); // 🌟 FIXED: Stops browser navigation / page reload issues

      const row = btn.closest(".task-row");
      const taskId = row.dataset.taskId;

      deleteResource(taskId, row);
    });
  });

  // 3. Open Edit Modal & Populate Form
  const editModal = document.getElementById("editModal");
  document.querySelectorAll(".edit-trigger").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("edit_task_id").value = btn.dataset.taskId;
      document.getElementById("edit_title").value = btn.dataset.title;
      document.getElementById("edit_description").value = btn.dataset.description;
      document.getElementById("edit_due_date").value = btn.dataset.dueDate;
      document.getElementById("edit_priority").value = btn.dataset.priority;
      editModal.classList.add("open");
    });
  });

  // Close Edit Modal Handlers
  document.getElementById("closeEditModal")?.addEventListener("click", () => editModal.classList.remove("open"));

  // 4. Submit Edit Form Asynchronously
  document.getElementById("editTaskForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const taskId = document.getElementById("edit_task_id").value;
    const formData = new FormData(e.target);
    const res = await fetch(`/tasks/${taskId}/edit`, { method: "POST", body: formData });
    if (res.ok) {
      window.location.reload();
    }
  });
}

// 🌟 FIXED: Moved outside initTaskMenusEngine so it is cleanly scoped globally
function deleteResource(id, rowElement) {
  triggerTaskTerminatedAnimation();

  if (rowElement) {
    rowElement.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    rowElement.style.opacity = "0";
    rowElement.style.transform = "scale(0.95)";

    setTimeout(() => {
      rowElement.remove();
      updateStrideBar();
    }, 200);
  }

  fetch(`/tasks/${id}/delete`, { method: 'POST' })
    .then(response => {
      if (!response.ok) {
        console.error('Task deletion failed on server side.');
      }
    })
    .catch(error => console.error('Network Error processing deletion:', error));
}

// --------------------------------------------------------- //
// Theme Switcher Implementation
// --------------------------------------------------------- //
function initThemeEngine() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem("stride-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("stride-theme", nextTheme);
  });
}
