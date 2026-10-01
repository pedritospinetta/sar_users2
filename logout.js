import {
    auth
} from "./firebase-config.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


const logoutButton =
    document.getElementById("logout-button");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                logoutButton.disabled = true;

                logoutButton.textContent =
                    "Cerrando...";


                await signOut(auth);


                window.location.replace(
                    "./"
                );


            } catch (error) {

                console.error(
                    "Error cerrando sesión:",
                    error
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Cerrar sesión";


                alert(
                    "No se pudo cerrar la sesión."
                );

            }

        }
    );

}
