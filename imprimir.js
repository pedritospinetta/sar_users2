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



async function comprobarComandante(
    usuario
) {

    const referencia =
        doc(
            db,
            "usuarios",
            usuario.uid
        );


    const documento =
        await getDoc(
            referencia
        );


    if (!documento.exists()) {

        return false;

    }


    const datos =
        documento.data();


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
            <div class="empty">
                No hay credenciales seleccionadas.
            </div>
        `;

        return;

    }


    let integrantes;


    try {

        integrantes =
            JSON.parse(
                guardado
            );

    } catch (error) {

        printArea.innerHTML = `
            <div class="empty">
                No se pudieron leer las credenciales.
            </div>
        `;

        return;

    }


    if (
        !Array.isArray(integrantes)
        ||
        integrantes.length === 0
    ) {

        printArea.innerHTML = `
            <div class="empty">
                No hay credenciales seleccionadas.
            </div>
        `;

        return;

    }


    /*
     * 8 por A4:
     * 2 columnas x 4 filas
     */

    const porPagina =
        8;


    for (
        let inicio = 0;
        inicio < integrantes.length;
        inicio += porPagina
    ) {

        const pagina =
            document.createElement(
                "section"
            );


        pagina.className =
            "page";


        const grupo =
            integrantes.slice(
                inicio,
                inicio + porPagina
            );


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



function crearCredencial(
    persona
) {

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
        "credential";


    card.innerHTML = `

        <div class="credential-left">

            <img
                src="./img/logo.jpg"
                alt="SAR"
                class="credential-logo"
            >


            <img
                src="${foto}"
                alt=""
                class="credential-photo"
                onerror="this.src='./img/logo.jpg'"
            >


            <div class="sar-title">
                SAR ARGENTINA
            </div>

        </div>


        <div class="credential-content">

            <div class="institution">
                CUERPO ARGENTINO DE RESCATE
            </div>


            <div class="credential-name">
                ${persona.nombre || ""}
            </div>


            <div class="credential-role">
                ${persona.cargo || ""}
            </div>


            <div class="credential-id">
                ${persona.id || ""}
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
            ></div>

        </div>

    `;


    setTimeout(
        () => {

            const qr =
                card.querySelector(
                    ".qr-container"
                );


            if (!qr) {

                return;

            }


            const url =
                `https://sar-members.org/?id=${encodeURIComponent(persona.id)}`;


            new QRCode(
                qr,
                {
                    text: url,

                    width: 160,

                    height: 160,

                    correctLevel:
                        QRCode.CorrectLevel.M
                }
            );

        },
        20
    );


    return card;

}
