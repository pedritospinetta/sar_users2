import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const printArea =
    document.getElementById(
        "print-area"
    );



async function comprobarComandante(usuario) {

    const usuarioRef =
        doc(
            db,
            "usuarios",
            usuario.uid
        );


    const snap =
        await getDoc(
            usuarioRef
        );


    if (!snap.exists()) {
        return false;
    }


    const datos =
        snap.data();


    return (
        datos.rol === "comandante"
        &&
        datos.activo === true
    );

}



onAuthStateChanged(
    auth,
    async usuario => {

        if (!usuario) {

            window.location.replace(
                "./login.html"
            );

            return;

        }


        try {

            const autorizado =
                await comprobarComandante(
                    usuario
                );


            if (!autorizado) {

                await signOut(auth);

                window.location.replace(
                    "./login.html"
                );

                return;

            }


            cargarCredenciales();


        } catch (error) {

            console.error(error);

            window.location.replace(
                "./login.html"
            );

        }

    }
);



function cargarCredenciales() {

    const guardado =
        sessionStorage.getItem(
            "credencialesImprimir"
        );


    if (!guardado) {

        printArea.innerHTML = `
            <div class="empty-message">
                No hay credenciales seleccionadas.
            </div>
        `;

        return;

    }


    const integrantes =
        JSON.parse(
            guardado
        );


    if (
        !Array.isArray(integrantes)
        ||
        integrantes.length === 0
    ) {

        printArea.innerHTML = `
            <div class="empty-message">
                No hay credenciales seleccionadas.
            </div>
        `;

        return;

    }


    /*
     * 8 credenciales por hoja A4:
     * 2 columnas × 4 filas
     */

    const porPagina =
        8;


    for (
        let inicio = 0;
        inicio < integrantes.length;
        inicio += porPagina
    ) {

        const grupo =
            integrantes.slice(
                inicio,
                inicio + porPagina
            );


        const pagina =
            document.createElement(
                "section"
            );


        pagina.className =
            "page";


        grupo.forEach(
            persona => {

                pagina.appendChild(
                    crearCredencial(
                        persona
                    )
                );

            }
        );


        printArea.appendChild(
            pagina
        );

    }

}



function crearCredencial(persona) {

    const estado =
        (
            persona.estado
            ||
            "inactivo"
        ).toLowerCase();


    const foto =
        persona.fotoUrl
        ||
        "./img/logo.jpg";


    const card =
        document.createElement(
            "article"
        );


    card.className =
        `credential ${estado}`;


    card.innerHTML = `

        <div class="credential-left">

            <img
                src="./img/logo.jpg"
                class="credential-logo"
                alt="SAR"
            >

            <img
                src="${foto}"
                class="credential-photo"
                alt="${persona.nombre || persona.id}"
            >

            <div class="sar-mini">
                SAR ARGENTINA
            </div>

        </div>


        <div class="credential-content">

            <div class="credential-title">
                Cuerpo Argentino de Rescate
            </div>


            <div class="credential-name">
                ${persona.nombre || ""}
            </div>


            <div class="credential-role">
                ${persona.cargo || ""}
            </div>


            <div class="credential-id">
                ${persona.id}
            </div>


            <div class="credential-data">

                ${
                    persona.dni
                    ? `DNI: ${persona.dni}<br>`
                    : ""
                }

                ${
                    persona.grupoSanguineo
                    ? `Grupo sanguíneo: ${persona.grupoSanguineo}<br>`
                    : ""
                }

                ${
                    persona.delegacion
                    ? `Delegación: ${persona.delegacion}`
                    : ""
                }

            </div>


            <div class="credential-status ${estado}">

                ${
                    estado === "activo"
                    ? "● ACTIVO"
                    : "● INACTIVO"
                }

            </div>


            <div
                class="qr-container"
                data-qr="${persona.id}"
            >
            </div>

        </div>


        <div class="cut-mark"></div>

    `;


    setTimeout(
        () => {

            const qr =
                card.querySelector(
                    `[data-qr="${persona.id}"]`
                );


            if (!qr) {
                return;
            }


            new QRCode(
                qr,
                {
                    text:
                        `https://sar-members.org/integrantes/${persona.id}`,

                    width: 150,
                    height: 150,

                    correctLevel:
                        QRCode.CorrectLevel.M
                }
            );

        },
        0
    );


    return card;

}
