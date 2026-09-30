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


    const resultado =
        await getDoc(
            referencia
        );


    if (!resultado.exists()) {

        return false;

    }


    const datos =
        resultado.data();


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

                await signOut(
                    auth
                );


                window.location.replace(
                    "./login.html"
                );

                return;

            }


            cargarCredenciales();


        } catch (error) {

            console.error(
                error
            );


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

        mostrarVacio(
            "No hay credenciales seleccionadas."
        );

        return;

    }


    let integrantes;


    try {

        integrantes =
            JSON.parse(
                guardado
            );

    } catch {

        mostrarVacio(
            "No se pudieron leer las credenciales."
        );

        return;

    }


    if (
        !Array.isArray(integrantes)
    ) {

        mostrarVacio(
            "No hay credenciales seleccionadas."
        );

        return;

    }


    /*
    SOLO PERMITIMOS IMPRIMIR
    INTEGRANTES ACTIVOS
    */

    integrantes =
        integrantes.filter(
            persona =>

                String(
                    persona.estado
                    ||
                    ""
                )
                    .toLowerCase()
                    .trim()

                === "activo"
        );


    if (
        integrantes.length === 0
    ) {

        mostrarVacio(

            "No hay integrantes activos seleccionados para imprimir."

        );

        return;

    }


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

    const foto =
        persona.fotoUrl
        ||
        "./img/logo.jpg";


    const tarjeta =
        document.createElement(
            "article"
        );


    tarjeta.className =
        "credential";


    tarjeta.innerHTML = `

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
                ${escapar(persona.nombre || "")}
            </div>


            <div class="credential-role">
                ${escapar(persona.cargo || "")}
            </div>


            <div class="credential-id">
                ${escapar(persona.id || "")}
            </div>


            <div class="credential-data">

                ${
                    persona.dni
                        ?
                        `DNI: ${escapar(persona.dni)}<br>`
                        :
                        ""
                }

                ${
                    persona.grupoSanguineo
                        ?
                        `Grupo sanguíneo: ${escapar(persona.grupoSanguineo)}<br>`
                        :
                        ""
                }

                ${
                    persona.delegacion
                        ?
                        `Delegación: ${escapar(persona.delegacion)}`
                        :
                        ""
                }

            </div>


            <div class="verification-text">

                <strong>
                    VERIFICACIÓN DE ESTADO
                </strong>

                Para verificar la vigencia
                y estado actual del personal,
                escanee el código QR.

            </div>


            <div class="qr-container"></div>

        </div>

    `;


    const imagen =
        tarjeta.querySelector(
            ".credential-photo"
        );


    imagen.addEventListener(
        "error",
        () => {

            imagen.src =
                "./img/logo.jpg";

        },
        {
            once: true
        }
    );


    setTimeout(
        () => {

            const qr =
                tarjeta.querySelector(
                    ".qr-container"
                );


            const url =
                `https://sar-members.org/integrante.html?id=${encodeURIComponent(persona.id)}`;


            new QRCode(
                qr,
                {

                    text:
                        url,

                    width:
                        160,

                    height:
                        160,

                    correctLevel:
                        QRCode.CorrectLevel.M

                }
            );

        },
        30
    );


    return tarjeta;

}



function mostrarVacio(
    mensaje
) {

    printArea.innerHTML = `

        <div class="empty">

            ${mensaje}

        </div>

    `;

}



function escapar(
    valor
) {

    return String(
        valor
        ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}
