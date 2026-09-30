import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const CLOUD_NAME =
    "hyvxppyb";


const UPLOAD_PRESET =
    "sar_integrantes";


let integrantes = [];

let integranteEditando = null;

let fotoActual = "";

let especialidadesActuales = [];

let alergiasActuales = [];

let afiliacionesActuales = [];


const loading =
    document.getElementById("loading");

const adminContent =
    document.getElementById("admin-content");

const membersGrid =
    document.getElementById("members-grid");

const modal =
    document.getElementById("member-modal");

const form =
    document.getElementById("member-form");


function mayusculas(valor) {

    return String(
        valor || ""
    )
        .trim()
        .toLocaleUpperCase(
            "es-AR"
        );

}


/* =========================================
MAYÚSCULAS EN TIEMPO REAL
========================================= */

document
    .querySelectorAll(
        ".uppercase-input"
    )
    .forEach(
        input => {

            input.addEventListener(
                "input",
                () => {

                    input.value =
                        input.value
                            .toLocaleUpperCase(
                                "es-AR"
                            );

                }
            );

        }
    );


/* =========================================
AUTENTICACIÓN
========================================= */

async function esComandante(usuario) {

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


let authRespondio = false;


setTimeout(
    () => {

        if (!authRespondio) {

            loading.innerHTML =
                "NO SE PUDO VERIFICAR LA SESIÓN. RECARGÁ LA PÁGINA.";

        }

    },
    10000
);


onAuthStateChanged(
    auth,
    async usuario => {

        authRespondio =
            true;


        if (!usuario) {

            window.location.replace(
                "./login.html"
            );

            return;

        }


        try {

            const autorizado =
                await esComandante(
                    usuario
                );


            if (!autorizado) {

                window.location.replace(
                    "./login.html"
                );

                return;

            }


            loading.style.display =
                "none";


            adminContent.style.display =
                "block";


            await cargarIntegrantes();


        } catch (error) {

            console.error(error);


            loading.innerHTML =
                "ERROR AL VERIFICAR LOS PERMISOS.";

        }

    }
);


/* =========================================
CARGAR
========================================= */

async function cargarIntegrantes() {

    membersGrid.innerHTML =
        "CARGANDO...";


    const resultado =
        await getDocs(
            collection(
                db,
                "integrantes"
            )
        );


    integrantes =
        resultado.docs.map(
            documento => ({

                id:
                    documento.id,

                ...documento.data()

            })
        );


    integrantes.sort(
        (a, b) =>

            a.id.localeCompare(
                b.id,
                undefined,
                {
                    numeric: true
                }
            )
    );


    mostrarIntegrantes(
        integrantes
    );

}


function mostrarIntegrantes(lista) {

    membersGrid.innerHTML =
        "";


    if (!lista.length) {

        membersGrid.innerHTML =
            "NO HAY INTEGRANTES REGISTRADOS.";

        return;

    }


    lista.forEach(
        persona => {

            const foto =
                persona.fotoUrl
                ||
                "./img/logo.jpg";


            const estado =
                String(
                    persona.estado
                    ||
                    "inactivo"
                )
                    .toLowerCase();


            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "admin-card";


            tarjeta.innerHTML = `

                <img
                    src="${foto}"
                    class="admin-photo"
                    alt=""
                >

                <div class="admin-card-body">

                    <div class="id">
                        ${escapar(persona.id)}
                    </div>

                    <h3>
                        ${escapar(persona.nombre || "")}
                    </h3>

                    <div class="role">
                        ${escapar(persona.cargo || "")}
                    </div>

                    <div class="status ${estado}">
                        ${estado.toUpperCase()}
                    </div>

                    <div class="card-actions">

                        <button
                            type="button"
                            data-edit="${persona.id}"
                        >
                            EDITAR
                        </button>

                        <a
                            href="./integrante.html?id=${encodeURIComponent(persona.id)}"
                            target="_blank"
                        >
                            VER FICHA
                        </a>

                        <button
                            type="button"
                            data-delete="${persona.id}"
                        >
                            ELIMINAR
                        </button>

                    </div>

                    <label class="select-row">

                        <input
                            type="checkbox"
                            class="print-check"
                            value="${persona.id}"
                        >

                        SELECCIONAR PARA IMPRIMIR

                    </label>

                </div>

            `;


            const imagen =
                tarjeta.querySelector(
                    ".admin-photo"
                );


            imagen.onerror =
                () => {

                    imagen.src =
                        "./img/logo.jpg";

                };


            tarjeta
                .querySelector(
                    "[data-edit]"
                )
                .addEventListener(
                    "click",
                    () => {

                        abrirEditar(
                            persona
                        );

                    }
                );


            tarjeta
                .querySelector(
                    "[data-delete]"
                )
                .addEventListener(
                    "click",
                    () => {

                        eliminarIntegrante(
                            persona
                        );

                    }
                );


            membersGrid.appendChild(
                tarjeta
            );

        }
    );

}


/* =========================================
TAGS
========================================= */

function configurarTags(
    inputId,
    botonId,
    contenedorId,
    obtenerArray,
    asignarArray
) {

    const input =
        document.getElementById(
            inputId
        );


    const boton =
        document.getElementById(
            botonId
        );


    function agregar() {

        const valor =
            mayusculas(
                input.value
            );


        if (!valor) {
            return;
        }


        const actual =
            obtenerArray();


        if (
            !actual.includes(
                valor
            )
        ) {

            actual.push(
                valor
            );

        }


        input.value =
            "";


        renderTags(
            contenedorId,
            actual,
            asignarArray
        );

    }


    boton.addEventListener(
        "click",
        agregar
    );


    input.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter"
            ) {

                evento.preventDefault();

                agregar();

            }

        }
    );

}


function renderTags(
    contenedorId,
    array,
    setter
) {

    const contenedor =
        document.getElementById(
            contenedorId
        );


    contenedor.innerHTML =
        "";


    array.forEach(
        valor => {

            const elemento =
                document.createElement(
                    "span"
                );


            elemento.className =
                "tag-item";


            elemento.innerHTML = `

                ${escapar(valor)}

                <button type="button">
                    ×
                </button>

            `;


            elemento
                .querySelector(
                    "button"
                )
                .addEventListener(
                    "click",
                    () => {

                        const nuevo =
                            array.filter(
                                item =>
                                    item !== valor
                            );


                        setter(
                            nuevo
                        );


                        renderTags(
                            contenedorId,
                            nuevo,
                            setter
                        );

                    }
                );


            contenedor.appendChild(
                elemento
            );

        }
    );

}


configurarTags(
    "specialty-input",
    "add-specialty",
    "specialty-tags",

    () =>
        especialidadesActuales,

    nuevo =>
        especialidadesActuales =
            nuevo
);


configurarTags(
    "allergy-input",
    "add-allergy",
    "allergy-tags",

    () =>
        alergiasActuales,

    nuevo =>
        alergiasActuales =
            nuevo
);


configurarTags(
    "affiliation-input",
    "add-affiliation",
    "affiliation-tags",

    () =>
        afiliacionesActuales,

    nuevo =>
        afiliacionesActuales =
            nuevo
);


/* =========================================
MODAL NUEVO
========================================= */

function abrirNuevo() {

    integranteEditando =
        null;


    fotoActual =
        "";


    especialidadesActuales =
        [];


    alergiasActuales =
        [];


    afiliacionesActuales =
        [];


    form.reset();


    document.getElementById(
        "member-id"
    ).disabled =
        false;


    document.getElementById(
        "modal-title"
    ).textContent =
        "NUEVO INTEGRANTE";


    document.getElementById(
        "photo-preview"
    ).src =
        "./img/logo.jpg";


    renderTodoTags();


    modal.classList.add(
        "open"
    );

}


/* =========================================
EDITAR
========================================= */

function abrirEditar(
    persona
) {

    integranteEditando =
        persona.id;


    fotoActual =
        persona.fotoUrl
        ||
        "";


    especialidadesActuales =
        Array.isArray(
            persona.especialidades
        )
            ?
            persona.especialidades
                .map(mayusculas)
            :
            [];


    alergiasActuales =
        Array.isArray(
            persona.alergias
        )
            ?
            persona.alergias
                .map(mayusculas)
            :
            [];


    afiliacionesActuales =
        Array.isArray(
            persona.afiliaciones
        )
            ?
            persona.afiliaciones
                .map(mayusculas)
            :
            [];


    document.getElementById(
        "modal-title"
    ).textContent =
        "EDITAR INTEGRANTE";


    document.getElementById(
        "member-id"
    ).value =
        persona.id;


    document.getElementById(
        "member-id"
    ).disabled =
        true;


    document.getElementById(
        "member-status"
    ).value =
        persona.estado
        ||
        "activo";


    document.getElementById(
        "member-name"
    ).value =
        mayusculas(
            persona.nombre
        );


    document.getElementById(
        "member-dni"
    ).value =
        mayusculas(
            persona.dni
        );


    document.getElementById(
        "member-role"
    ).value =
        mayusculas(
            persona.cargo
        );


    document.getElementById(
        "member-delegation"
    ).value =
        mayusculas(
            persona.delegacion
        );


    document.getElementById(
        "member-blood"
    ).value =
        persona.grupoSanguineo
        ||
        "";


    document.getElementById(
        "member-entry"
    ).value =
        mayusculas(
            persona.ingreso
        );


    document.getElementById(
        "member-blood-donor"
    ).checked =
        persona.donanteSangre === true;


    document.getElementById(
        "member-organ-donor"
    ).checked =
        persona.donanteOrganos === true;


    document.getElementById(
        "member-public-emergency"
    ).checked =
        persona.publicarEmergencia === true;


    document.getElementById(
        "photo-preview"
    ).src =
        fotoActual
        ||
        "./img/logo.jpg";


    renderTodoTags();


    modal.classList.add(
        "open"
    );

}


function renderTodoTags() {

    renderTags(
        "specialty-tags",
        especialidadesActuales,
        nuevo =>
            especialidadesActuales =
                nuevo
    );


    renderTags(
        "allergy-tags",
        alergiasActuales,
        nuevo =>
            alergiasActuales =
                nuevo
    );


    renderTags(
        "affiliation-tags",
        afiliacionesActuales,
        nuevo =>
            afiliacionesActuales =
                nuevo
    );

}


/* =========================================
FOTO CLOUDINARY
========================================= */

async function subirFotoCloudinary(
    archivo
) {

    const datos =
        new FormData();


    datos.append(
        "file",
        archivo
    );


    datos.append(
        "upload_preset",
        UPLOAD_PRESET
    );


    const respuesta =
        await fetch(

            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

            {
                method:
                    "POST",

                body:
                    datos
            }

        );


    if (!respuesta.ok) {

        throw new Error(
            "No se pudo subir la foto."
        );

    }


    const resultado =
        await respuesta.json();


    return resultado.secure_url;

}


/* =========================================
GUARDAR
========================================= */

form.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        const mensaje =
            document.getElementById(
                "form-message"
            );


        const boton =
            document.getElementById(
                "save-button"
            );


        const id =
            mayusculas(
                document.getElementById(
                    "member-id"
                ).value
            );


        if (
            !/^SAR-\d+$/.test(id)
        ) {

            mensaje.textContent =
                "EL ID DEBE TENER FORMATO SAR-001.";

            return;

        }


        boton.disabled =
            true;


        mensaje.textContent =
            "GUARDANDO...";


        try {

            if (!integranteEditando) {

                const existente =
                    await getDoc(
                        doc(
                            db,
                            "integrantes",
                            id
                        )
                    );


                if (existente.exists()) {

                    throw new Error(
                        "YA EXISTE UN INTEGRANTE CON ESE ID."
                    );

                }

            }


            let fotoUrl =
                fotoActual;


            const archivo =
                document.getElementById(
                    "member-photo"
                ).files[0];


            if (archivo) {

                if (
                    ![
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ].includes(
                        archivo.type
                    )
                ) {

                    throw new Error(
                        "LA FOTO DEBE SER JPG, PNG O WEBP."
                    );

                }


                if (
                    archivo.size >
                    5 * 1024 * 1024
                ) {

                    throw new Error(
                        "LA FOTO NO PUEDE SUPERAR 5 MB."
                    );

                }


                fotoUrl =
                    await subirFotoCloudinary(
                        archivo
                    );

            }


            const datos = {

                nombre:
                    mayusculas(
                        document.getElementById(
                            "member-name"
                        ).value
                    ),

                dni:
                    mayusculas(
                        document.getElementById(
                            "member-dni"
                        ).value
                    ),

                cargo:
                    mayusculas(
                        document.getElementById(
                            "member-role"
                        ).value
                    ),

                estado:
                    document.getElementById(
                        "member-status"
                    ).value,

                delegacion:
                    mayusculas(
                        document.getElementById(
                            "member-delegation"
                        ).value
                    ),

                grupoSanguineo:
                    document.getElementById(
                        "member-blood"
                    ).value,

                ingreso:
                    mayusculas(
                        document.getElementById(
                            "member-entry"
                        ).value
                    ),

                especialidades:
                    especialidadesActuales
                        .map(mayusculas),

                alergias:
                    alergiasActuales
                        .map(mayusculas),

                afiliaciones:
                    afiliacionesActuales
                        .map(mayusculas),

                donanteSangre:
                    document.getElementById(
                        "member-blood-donor"
                    ).checked,

                donanteOrganos:
                    document.getElementById(
                        "member-organ-donor"
                    ).checked,

                publicarEmergencia:
                    document.getElementById(
                        "member-public-emergency"
                    ).checked,

                fotoUrl:
                    fotoUrl,

                actualizado:
                    serverTimestamp()

            };


            if (!integranteEditando) {

                datos.creado =
                    serverTimestamp();

            }


            await setDoc(

                doc(
                    db,
                    "integrantes",
                    integranteEditando
                    ||
                    id
                ),

                datos,

                {
                    merge: true
                }

            );


            modal.classList.remove(
                "open"
            );


            await cargarIntegrantes();


        } catch (error) {

            console.error(error);


            mensaje.textContent =
                error.message
                ||
                "ERROR AL GUARDAR.";

        } finally {

            boton.disabled =
                false;

        }

    }
);


/* =========================================
FOTO PREVIEW
========================================= */

document
    .getElementById(
        "member-photo"
    )
    .addEventListener(
        "change",
        evento => {

            const archivo =
                evento.target.files[0];


            if (!archivo) {
                return;
            }


            document.getElementById(
                "photo-preview"
            ).src =
                URL.createObjectURL(
                    archivo
                );

        }
    );


/* =========================================
ELIMINAR
========================================= */

async function eliminarIntegrante(
    persona
) {

    const confirmar =
        confirm(

            `¿ELIMINAR DEFINITIVAMENTE A ${persona.nombre}?\n\n` +
            "SI SOLO DEJÓ DE PERTENECER AL SAR, ES MEJOR MARCARLO COMO INACTIVO."

        );


    if (!confirmar) {
        return;
    }


    await deleteDoc(
        doc(
            db,
            "integrantes",
            persona.id
        )
    );


    await cargarIntegrantes();

}


/* =========================================
BOTONES
========================================= */

document
    .getElementById(
        "new-member"
    )
    .addEventListener(
        "click",
        abrirNuevo
    );


document
    .getElementById(
        "close-modal"
    )
    .addEventListener(
        "click",
        () => {

            modal.classList.remove(
                "open"
            );

        }
    );


document
    .getElementById(
        "cancel-button"
    )
    .addEventListener(
        "click",
        () => {

            modal.classList.remove(
                "open"
            );

        }
    );


document
    .getElementById(
        "view-site"
    )
    .addEventListener(
        "click",
        () => {

            window.open(
                "./",
                "_blank"
            );

        }
    );


document
    .getElementById(
        "admin-search"
    )
    .addEventListener(
        "input",
        evento => {

            const texto =
                mayusculas(
                    evento.target.value
                );


            const filtrados =
                integrantes.filter(
                    persona =>

                        [
                            persona.id,
                            persona.nombre,
                            persona.cargo,
                            persona.delegacion
                        ]
                            .join(" ")
                            .toLocaleUpperCase(
                                "es-AR"
                            )
                            .includes(
                                texto
                            )
                );


            mostrarIntegrantes(
                filtrados
            );

        }
    );


document
    .getElementById(
        "select-all"
    )
    .addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".print-check"
                )
                .forEach(
                    check =>
                        check.checked =
                            true
                );

        }
    );


document
    .getElementById(
        "clear-selection"
    )
    .addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".print-check"
                )
                .forEach(
                    check =>
                        check.checked =
                            false
                );

        }
    );


document
    .getElementById(
        "print-selected"
    )
    .addEventListener(
        "click",
        () => {

            const ids =
                [
                    ...document.querySelectorAll(
                        ".print-check:checked"
                    )
                ]
                    .map(
                        check =>
                            check.value
                    );


            const seleccionados =
                integrantes.filter(
                    persona =>
                        ids.includes(
                            persona.id
                        )
                );


            if (
                seleccionados.length === 0
            ) {

                alert(
                    "SELECCIONÁ AL MENOS UN INTEGRANTE."
                );

                return;

            }


            sessionStorage.setItem(

                "credencialesImprimir",

                JSON.stringify(
                    seleccionados
                )

            );


            window.open(
                "./imprimir.html",
                "_blank"
            );

        }
    );


function escapar(valor) {

    return String(
        valor ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
