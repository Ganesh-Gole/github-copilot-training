document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const template = document.getElementById("activity-template");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4 class="activity-title">${name}</h4>
          <p class="activity-desc">${details.description}</p>
          <p class="activity-schedule"><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <ul class="participants-list"></ul>
        `;

        const participantsUl = activityCard.querySelector(".participants-list");

        // Add participants if available
        if (details.participants && details.participants.length) {
          details.participants.forEach(email => {
            participantsUl.appendChild(createParticipantLi(email, name));
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          participantsUl.appendChild(li);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper to create participant <li> with avatar, email text and delete button
  function createParticipantLi(email, activityName) {
    const li = document.createElement("li");
    const avatar = document.createElement("span");
    avatar.className = "participant-avatar";
    avatar.textContent = initials(email);
    li.appendChild(avatar);
    const txt = document.createElement("span");
    txt.textContent = email;
    li.appendChild(txt);

    const del = document.createElement("button");
    del.className = "participant-delete";
    del.title = "Unregister";
    del.textContent = "✖";
    del.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: "POST" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Unregister failed" }));
          throw new Error(err.detail || "Unregister failed");
        }
        const json = await res.json();
        // Remove the li from the UI
        const ul = li.parentElement;
        ul.removeChild(li);
        // If no participants remain, show placeholder
        if (!ul.children.length) {
          const placeholder = document.createElement("li");
          placeholder.textContent = "No participants yet";
          ul.appendChild(placeholder);
        }
        showMessage(json.message, "success");
      } catch (err) {
        showMessage(err.message, "error");
      }
    });

    li.appendChild(del);
    return li;
  }

  function initials(email) {
    const name = email.split("@")[0];
    const parts = name.split(/[\._\-]/).filter(Boolean);
    const a = parts[0] ? parts[0][0].toUpperCase() : "";
    const b = parts[1] ? parts[1][0].toUpperCase() : parts[0] && parts[0][1] ? parts[0][1].toUpperCase() : "";
    return (a + b).slice(0, 2) || "?";
  }

  function showMessage(text, type) {
    messageDiv.className = "message " + type;
    messageDiv.textContent = text;
    setTimeout(() => { messageDiv.className = "hidden"; }, 3500);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activityName = activitySelect.value;
    if (!activityName) return showMessage("Please select an activity", "error");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Signup failed" }));
        throw new Error(err.detail || "Signup failed");
      }
      const json = await response.json();
      showMessage(json.message, "success");

      // Update the participants list in the corresponding card
      document.querySelectorAll(".activity-card").forEach(card => {
        if (card.querySelector(".activity-title").textContent === activityName) {
          const ul = card.querySelector(".participants-list");
          const placeholder = Array.from(ul.children).find(li => li.textContent === "No participants yet");
          if (placeholder) ul.removeChild(placeholder);
          const li = document.createElement("li");
          const avatar = document.createElement("span");
          avatar.className = "participant-avatar";
          avatar.textContent = initials(email);
          li.appendChild(avatar);
          const txt = document.createElement("span");
          txt.textContent = email;
          li.appendChild(txt);
          ul.appendChild(li);
        }
      });
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  // Initialize app
  fetchActivities();
});
