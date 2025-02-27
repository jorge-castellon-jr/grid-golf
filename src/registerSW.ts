// import { registerSW } from "virtual:pwa-register";

// const updateSW = registerSW({
//   onNeedRefresh() {
//     // Show a prompt to the user when an update is available
//     if (confirm("New version available. Update now?")) {
//       updateSW();
//     }
//   },
//   onOfflineReady() {
//     console.log("App ready to work offline");
//
//     // Create notification element
//     const offlineReadyDiv = document.createElement("div");
//     offlineReadyDiv.innerHTML = "Ready for offline use!";
//     offlineReadyDiv.style.position = "fixed";
//     offlineReadyDiv.style.bottom = "10px";
//     offlineReadyDiv.style.left = "50%";
//     offlineReadyDiv.style.transform = "translateX(-50%)";
//     offlineReadyDiv.style.backgroundColor = "#166534";
//     offlineReadyDiv.style.color = "white";
//     offlineReadyDiv.style.padding = "10px 20px";
//     offlineReadyDiv.style.borderRadius = "4px";
//     offlineReadyDiv.style.zIndex = "9999";
//     document.body.appendChild(offlineReadyDiv);
//
//     // Remove notification after 3 seconds
//     setTimeout(() => {
//       offlineReadyDiv.remove();
//     }, 3000);
//   },
// });
