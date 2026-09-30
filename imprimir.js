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

    const documento =
        await getDoc(
            doc(
                db,
                "usuarios",
                usuario.uid
            )
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

        vacio(
            "NO HAY CREDENCIALES SELECCIONADAS."
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

        vacio(
            "NO SE PUDIERON CARGAR LAS CREDENCIALES."
        );

        return;

    }


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


    if (!integrantes.length) {

        vacio(
            "NO HAY INTEGRANTES ACTIVOS PARA IMPRIMIR."
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


        integrantes
            .slice(
                inicio,
                inicio + porPagina
            )
            .forEach(
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


    const cargo =
        mayusculas(
            persona.cargo
        );


    const esComandante =
        cargo === "COMANDANTE";


    const tarjeta =
        document.createElement(
            "article"
        );


    tarjeta.className =
        "credential";


    tarjeta.innerHTML = `

        <div class="orange-line"></div>

        <div class="argentina-band"></div>


        <img
            src="./img/logo.jpg"
            class="watermark"
            alt=""
        >


        <div class="credential-inner">


            <div class="left">

                <img
                    src="./img/logo.jpg"
                    class="logo"
                    alt="SAR"
                >


                <img
                    src="${foto}"
                    class="photo"
                    alt=""
                >


                <div class="sar">
                    SAR ARGENTINA
                </div>

            </div>


            <div class="right">


                <div class="institution">
                    CUERPO ARGENTINO DE RESCATE
                </div>


                <div class="name">
                    ${escapar(
                        mayusculas(
                            persona.nombre
                        )
                    )}
                </div>


                <div
                    class="
                        role
                        ${esComandante ? "commander" : ""}
                    "
                >
                    ${escapar(cargo)}
                </div>


                <div class="member-id">
                    ${escapar(persona.id)}
                </div>


                <div class="data">

                    ${
                        persona.dni
                            ?
                            `DNI: ${escapar(mayusculas(persona.dni))}<br>`
                            :
                            ""
                    }

                    ${
                        persona.grupoSanguineo
                            ?
                            `GRUPO SANGUÍNEO: ${escapar(persona.grupoSanguineo)}<br>`
                            :
                            ""
                    }

                    ${
                        persona.delegacion
                            ?
                            `DELEGACIÓN: ${escapar(mayusculas(persona.delegacion))}`
                            :
                            ""
                    }

                </div>


                <div class="verification">

                    <strong>
                        VERIFICACIÓN DIGITAL
                    </strong>

                    PARA VERIFICAR LA VIGENCIA
                    Y EL ESTADO ACTUAL DEL PERSONAL,
                    ESCANEE EL CÓDIGO QR.

                </div>


                <div class="qr"></div>


            </div>


        </div>


        <div class="microtext">

            SAR ARGENTINA • VERIFICAR SIEMPRE MEDIANTE QR •
            IDENTIFICACIÓN ${escapar(persona.id)} •
            SAR ARGENTINA • VERIFICACIÓN DIGITAL •

        </div>

    `;


    const fotoElemento =
        tarjeta.querySelector(
            ".photo"
        );


    fotoElemento.onerror =
        () => {

            fotoElemento.src =
                "./img/logo.jpg";

        };


    setTimeout(
        () => {

            const qr =
                tarjeta.querySelector(
                    ".qr"
                );


            const url =
                `https://sar-members.org/integrante.html?id=${encodeURIComponent(persona.id)}`;


            new QRCode(
                qr,
                {

                    text:
                        url,

                    width:
                        180,

                    height:
                        180,

                    correctLevel:
                        QRCode.CorrectLevel.M

                }
            );

        },
        20
    );


    return tarjeta;

}


function mayusculas(
    valor
) {

    return String(
        valor
        ||
        ""
    )
        .trim()
        .toLocaleUpperCase(
            "es-AR"
        );

}


function escapar(
    valor
) {

    return String(
        valor ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function vacio(
    mensaje
) {

    printArea.innerHTML = `

        <div class="empty">
            ${mensaje}
        </div>

    `;

}
