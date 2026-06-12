// 'use client';

// import { useEffect } from 'react';

// export default function DisableInspect() {
//   useEffect(() => {
//     // Disable right click
//     const disableRightClick = (e: MouseEvent) => {
//       e.preventDefault();
//       return false;
//     };

//     // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
//     const disableKeys = (e: KeyboardEvent) => {
//       if (
//         e.key === 'F12' ||
//         (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
//         (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
//       ) {
//         e.preventDefault();
//         return false;
//       }
//     };

//     document.addEventListener('contextmenu', disableRightClick);
//     document.addEventListener('keydown', disableKeys);

//     return () => {
//       document.removeEventListener('contextmenu', disableRightClick);
//       document.removeEventListener('keydown', disableKeys);
//     };
//   }, []);

//   return null;
// }