import { memorialProfile, memorialProfilesList } from "./mockData.js";
import { renderMemorialPage } from "./render.js";

const backendOrigin = "http://localhost:3000";
const repoName = 'Eternal-Memories';

// Helper function to create proper GitHub Pages URLs
function createGithubPagesUrl(path) {
    if (!path.startsWith('/')) path = '/' + path;
    return `/${repoName}${path}`;
}

// Helper function to strip repo name from path
function stripRepoName(path) {
    return path.replace(`/${repoName}`, '');
}

// Get paths without repo name for routing
export let paths = stripRepoName(window.location.pathname).split("/").filter(Boolean);

// Export navigation function for use in other modules
export function navigateTo(path) {
    const fullPath = createGithubPagesUrl(path);
    history.pushState(null, '', fullPath);
    // Update paths for routing
    paths = stripRepoName(window.location.pathname).split("/").filter(Boolean);
    // Dispatch route change event
    document.dispatchEvent(new CustomEvent('route:changed', { 
        detail: { path: fullPath }
    }));
}

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
        const profiles = await response.json();
        renderMemorialProfilesList(profiles);
        // Update URL preserving repo name
        history.replaceState(null, '', createGithubPagesUrl('/memorial_profiles'));
      } catch (e) {
        console.error(e);
        //static fall back for testing
        renderMemorialProfilesList(memorialProfilesList);
        // Update URL preserving repo name
        history.replaceState(null, '', createGithubPagesUrl('/memorial_profiles'));
      }
    });
  } else {
    console.log("404");
    // Redirect to memorial profiles as default
    history.replaceState(null, '', createGithubPagesUrl('/memorial_profiles'));
  }
}
