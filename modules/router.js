import { memorialProfile, memorialProfilesList } from "./mockData.js";
import { renderMemorialPage } from "./render.js";

const backendOrigin = "http://localhost:3000";
export let paths = window.location.pathname.split("/").filter(Boolean);

function renderMemorialProfilesList(profiles) {
  const container = document.querySelector(".memorial-profiles-list");
  if (!container) return;
  
  container.innerHTML = profiles.map(profile => `
    <div class="profile-card" data-id="${profile.id}">
      <img src="${profile.profilePic}" alt="${profile.name}'s profile picture">
      <h3>${profile.name}</h3>
    </div>
  `).join('');
}

export function startUpRouting() {
  console.log("Current View:", paths);

  //onload routing
  if (paths[0] === "memorial_page" && paths[1]) {
    const memorialId = paths[1];
    document.addEventListener("DOMContentLoaded", async () => {
      console.log("Loading memorial page for ID:", memorialId);
      try {
        const response = await fetch(
          `${backendOrigin}/api/memorial_profiles/${memorialId}`
        );
        if (!response.ok) {
          throw new Error(
            `Error fetching memorial profile: ${response.statusText}`
          );
        }
        renderMemorialPage(await response.json());
      } catch (e) {
        console.error("Failed to fetch memorial profile:", e);
        // Fallback to mock data for testing
        renderMemorialPage(memorialProfile);
      }
    });
  } else if (paths[0] === "memorial_profiles") {
    document.addEventListener("DOMContentLoaded", async () => {
      try {
        const response = await fetch(
          `${backendOrigin}/api/memorial_profiles/recent`
        );
        if (!response.ok) {
          throw new Error(
            `Error fetching recent memorial profiles: ${response.statusText}`
          );
        }
      } catch (e) {
        console.error(e);
        //static fall back for testing
        renderMemorialProfilesList(memorialProfilesList);
      }
    });
  } else {
    console.log("404");
  }
}
