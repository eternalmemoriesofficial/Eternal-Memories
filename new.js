import { renderMemorialPage } from "./modules/render.js";

const backendOrigin = "http://localhost:3000";
window.BACKEND_ORIGIN = backendOrigin;

// Get the repository name for GitHub Pages
const repoName = 'Eternal-Memories';

// Helper function to create proper GitHub Pages URLs
function createGithubPagesUrl(path) {
    // Ensure path starts with slash
    if (!path.startsWith('/')) path = '/' + path;
    // Always include repo name in the URL
    return `/${repoName}${path}`;
}

// Handle path from sessionStorage if coming from 404.html
const storedPath = sessionStorage.getItem('spa-path');
if (storedPath) {
    history.replaceState(null, '', createGithubPagesUrl(storedPath));
    sessionStorage.removeItem('spa-path');
}

// Strip the repository name from the path for routing
let paths = window.location.pathname.replace(`/${repoName}`, '').split('/').filter(Boolean);
console.log("Current View:", paths);
 
//onload routing
if (paths[0] === "memorial_page" && paths[1]) {
  alert("memorial page loaded")
  let memorialId = paths[1];
    document.addEventListener("DOMContentLoaded", async () => {
        const memorialProfileId = paths[1];
        console.log("Loading memorial page for ID:", memorialId);
        //memorial profiles table to store data
        try {
            alert("try")
            const response = await fetch(`${backendOrigin}/api/memorial_profiles/${memorialProfileId}`);
            if (!response.ok) {
                throw new Error(`Error fetching memorial profile: ${response.statusText}`);
            }

            renderMemorialPage(await response.json());
        }catch(e){
            alert("catch")
            console.error(e);
            //static fall back for testing
            renderMemorialPage({
                id: memorialProfileId, //optional
                name: "John Doe",
                birthdate: "1950-01-01",
                lastday: "2020-12-31",
                profilePic: "\PlayerFilled.png",
                coverPhoto: undefined,
                remark: "A beloved member of the community.",
                memories: [
                    {
                        id: 1,  
                        title: "Graduation Day",
                        imageUrl: "https://via.placeholder.com/300",
                        createdAt: "2021-01-01",
                        uploadedBy: "Alice"
                    }
                ],
                candles: [
                    { name: "Visitor1", count: 5, timeStamps: [] },
                    { name: "Visitor2", count: 3, timeStamps: [] }
                ],
                letters: [
                    { content: "You are missed dearly.", sender: "Bob", timeStamp: "2021-02-01" }
                ]
            });
            
            // Update URL with repo name preserved
            history.replaceState(null, '', createGithubPagesUrl(`/memorial_page/${memorialProfileId}`));
        }
    })
}else if(paths[0] === "memorial_profiles"){
    // Update URL with repo name preserved for memorial profiles
    history.replaceState(null, '', createGithubPagesUrl('/memorial_profiles'));
    document.addEventListener("DOMContentLoaded", async () =>{
        try{
            const response = await fetch(`${backendOrigin}/api/memorial_profiles/recent`);
            if(!response.ok){
                throw new Error(`Error fetching recent memorial profiles: ${response.statusText}`);
            }
        }catch(e){
            console.error(e)
            //static fall back for testing
            renderMemorialProfilesList([
                {
                    id: 'john_doe_5',
                    name: "John Doe",
                    profilePic: "https://via.placeholder.com/150",
                }
            ])
        }
    })
    
}else{
    console.log('404')
}