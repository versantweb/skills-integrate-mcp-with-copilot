document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";


      // Nouvelle version : chaque activité = carte avec bouton S'inscrire
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants :</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>Aucun participant pour l'instant</em></p>`;

        // Carte activité avec bouton S'inscrire
        activityCard.innerHTML = `
          <h4><span class="activity-icon">🏆</span> ${name}</h4>
          <p>${details.description}</p>
          <p><strong>🕒 Horaires :</strong> ${details.schedule}</p>
          <p><strong>🎟️ Places restantes :</strong> ${spotsLeft}</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="signup-message hidden"></div>
          <input type="email" class="signup-email" placeholder="📧 Votre email" required />
          <button class="signup-btn" data-activity="${name}">S'inscrire <span aria-hidden="true">🚀</span></button>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to signup buttons
      document.querySelectorAll(".signup-btn").forEach((button) => {
        button.addEventListener("click", handleSignupFromCard);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }


  // Nouvelle gestion : inscription via chaque carte
  // Vérifie le format de l'email et l'existence du domaine
  async function handleSignupFromCard(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const card = button.closest(".activity-card");
    const emailInput = card.querySelector(".signup-email");
    const email = emailInput.value.trim();
    const localMsg = card.querySelector(".signup-message");
    function showLocalMsg(txt) {
      localMsg.textContent = txt;
      localMsg.className = "signup-message error";
      localMsg.style.display = "flex";
      setTimeout(() => { localMsg.classList.add("hidden"); localMsg.style.display = "none"; }, 4000);
    }
    if (!email) {
      showLocalMsg("Veuillez entrer votre email.");
      return;
    }
    // Vérification du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      showLocalMsg("Format d'adresse e-mail invalide.");
      return;
    }
    // Vérification de l'existence du domaine (requête DNS via fetch)
    const domain = email.split('@')[1];
    try {
      // On tente de faire une requête vers le domaine (HEAD ou GET favicon.ico)
      const domainCheck = await fetch(`https://${domain}/favicon.ico`, { method: 'HEAD', mode: 'no-cors' });
      // Si pas d'erreur réseau, on considère le domaine comme existant
    } catch (e) {
      showLocalMsg("Le nom de domaine de l'adresse e-mail n'existe pas.");
      return;
    }
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        emailInput.value = "";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Une erreur est survenue.";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Échec de l'inscription. Veuillez réessayer.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
      console.error("Erreur inscription:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
