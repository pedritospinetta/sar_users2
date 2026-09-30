import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
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


/* =========================================
CLOUDINARY
========================================= */

const CLOUD_NAME =
    "hyvxppyb";


const UPLOAD_PRESET =
    "sar_integrantes";


/* =========================================
VARIABLES
========================================= */

let integrantes = [];

let integranteEditando = null;

let fotoActual = "";

let especialidadesActuales = [];

let alergiasActuales = [];

let afiliacionesActuales = [];


/* =========================================
ELEMENTOS
========================================= */

const loading =
    document.getElementById(
        "loading"
    );


const adminContent =
    document.getElementById(
        "admin-content"
    );


const membersGrid =
    document.getElementById(
        "members-grid"
    );


const modal =
    document.getElementById(
        "member-modal"
    );


const form =
    document.getElementById(
        "member-form"
    );


const modalTitle =
    document.getElementById(
        "modal-title"
    );


const formMessage =
    document.getElementById(
        "form-message"
    );


const photoPreview =
    document.getElementById(
        "photo-preview"
    );


const saveButton =
    document.getElementById(
        "save-button"
    );


/* =========================================
VALIDAR ELEMENTOS
========================================= */

const elementosObligatorios = [

    "loading",
    "admin-content",
    "members-grid",

    "new-member",
    "admin-search",

    "select-all",
    "clear-selection",
    "print-selected",

    "view-site",
    "logout-button",

    "member-modal",
    "modal-title",
    "close-modal",

    "member-form",

    "member-id",
    "member-status",
    "member-name",
    "member-dni",
    "member-role",
    "member-delegation",
    "member-blood",
    "member-entry",

    "specialty-input",
    "add-specialty",
    "specialty-tags",

    "allergy-input",
    "add-allergy",
    "allergy-tags",

    "affiliation-input",
    "add-affiliation",
    "affiliation-tags",

    "member-blood-donor",
    "member-organ-donor",
    "member-public-emergency",

    "member-photo",
    "photo-preview",

    "form-message",
    "cancel-button",
    "save-button"

];


for (
    const id
    of elementosObligatorios
) {

    if (
        !document.getElementById(id)
    ) {

        throw new Error(
            `FALTA EL ELEMENTO HTML #${id}`
        );

    }

}


/* =========================================
UTILIDADES
========================================= */

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


/* =========================================
MAYÚSCULAS AUTOMÁTICAS
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


    if (
        !documento.exists()
    ) {

        throw new Error(
            "NO EXISTE EL REGISTRO ADMINISTRATIVO DE ESTE USUARIO."
        );

    }


    const datos =
        documento.data();


    if (
        datos.rol !==
        "comandante"
    ) {

        throw new Error(
            "ESTE USUARIO NO TIENE ROL DE COMANDANTE."
        );

    }


    if (
        datos.activo !==
        true
    ) {

        throw new Error(
            "LA CUENTA ADMINISTRATIVA ESTÁ INACTIVA."
        );

    }


    return datos;

}


let authRespondio =
    false;


setTimeout(
    () => {

        if (
            !authRespondio
        ) {

            loading.textContent =
                "FIREBASE ESTÁ TARDANDO EN VERIFICAR LA SESIÓN. RECARGÁ LA PÁGINA.";


            loading.className =
                "error";

        }

    },
    10000
);


onAuthStateChanged(
    auth,
    async usuario => {

        authRespondio =
            true;


        if (
            !usuario
        ) {

            window.location.replace(
                "./login.html"
            );

            return;

        }


        try {

            loading.textContent =
                "VERIFICANDO PERMISOS DEL COMANDANTE...";


            await comprobarComandante(
                usuario
            );


            loading.style.display =
                "none";


            adminContent.style.display =
                "block";


            await cargarIntegrantes();


        } catch (error) {

            console.error(
                error
            );


            loading.style.display =
                "block";


            loading.textContent =
                `ERROR: ${error.message}`;


            loading.className =
                "error";

        }

    }
);


/* =========================================
CERRAR SESIÓN
========================================= */

document
    .getElementById(
        "logout-button"
    )
    .addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );

            } finally {

                window.location.replace(
                    "./login.html"
                );

            }

        }
    );


/* =========================================
CARGAR INTEGRANTES
========================================= */

async function cargarIntegrantes() {

    membersGrid.innerHTML = `

        <div class="empty">

            CARGANDO INTEGRANTES...

        </div>

    `;


    try {

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

                String(
                    a.id
                )
                    .localeCompare(

                        String(
                            b.id
                        ),

                        undefined,

                        {
                            numeric:
                                true
                        }

                    )
        );


        mostrarIntegrantes(
            integrantes
        );


    } catch (error) {

        console.error(
            "Error cargando integrantes:",
            error
        );


        membersGrid.innerHTML = `

            <div class="empty">

                ERROR AL CARGAR INTEGRANTES:

                <br><br>

                ${escapar(
                    error.message
                )}

            </div>

        `;

    }

}


/* =========================================
RENDER DE INTEGRANTES
========================================= */

function mostrarIntegrantes(
    lista
) {

    membersGrid.innerHTML =
        "";


    if (
        lista.length === 0
    ) {

        membersGrid.innerHTML = `

            <div class="empty">

                NO HAY INTEGRANTES REGISTRADOS.

            </div>

        `;

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
                    .toLowerCase()
                    .trim();


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

                    <div class="member-id">

                        ${escapar(
                            persona.id
                        )}

                    </div>


                    <h3>

                        ${escapar(
                            mayusculas(
                                persona.nombre
                                ||
                                "SIN NOMBRE"
                            )
                        )}

                    </h3>


                    <div class="member-role">

                        ${escapar(
                            mayusculas(
                                persona.cargo
                                ||
                                "SIN CARGO"
                            )
                        )}

                    </div>


                    <div
                        class="status ${estado}"
                    >

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
                            rel="noopener noreferrer"
                        >
                            VER FICHA
                        </a>


                        <button
                            type="button"
                            data-print="${persona.id}"
                        >
                            IMPRIMIR
                        </button>


                        <button
                            type="button"
                            class="delete-button"
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


            tarjeta
                .querySelector(
                    "[data-print]"
                )
                .addEventListener(
                    "click",
                    () => {

                        imprimirPersonas(
                            [
                                persona
                            ]
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
BUSCAR
========================================= */

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
                    persona => {

                        const contenido =
                            [

                                persona.id,
                                persona.nombre,
                                persona.cargo,
                                persona.dni,
                                persona.delegacion,

                                Array.isArray(
                                    persona.especialidades
                                )
                                    ?
                                    persona.especialidades.join(
                                        " "
                                    )
                                    :
                                    ""

                            ]
                                .join(
                                    " "
                                )
                                .toLocaleUpperCase(
                                    "es-AR"
                                );


                        return contenido.includes(
                            texto
                        );

                    }
                );


            mostrarIntegrantes(
                filtrados
            );

        }
    );


/* =========================================
TAGS
========================================= */

function renderTags(
    contenedorId,
    valores,
    setter
) {

    const contenedor =
        document.getElementById(
            contenedorId
        );


    contenedor.innerHTML =
        "";


    valores.forEach(
        valor => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "tag-item";


            const texto =
                document.createElement(
                    "span"
                );


            texto.textContent =
                valor;


            const boton =
                document.createElement(
                    "button"
                );


            boton.type =
                "button";


            boton.textContent =
                "×";


            boton.addEventListener(
                "click",
                () => {

                    const nuevo =
                        valores.filter(
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


            tag.appendChild(
                texto
            );


            tag.appendChild(
                boton
            );


            contenedor.appendChild(
                tag
            );

        }
    );

}


function configurarTagInput(
    inputId,
    buttonId,
    containerId,
    getter,
    setter
) {

    const input =
        document.getElementById(
            inputId
        );


    const boton =
        document.getElementById(
            buttonId
        );


    function agregar() {

        const valor =
            mayusculas(
                input.value
            );


        if (
            !valor
        ) {

            return;

        }


        const actuales =
            [
                ...getter()
            ];


        if (
            !actuales.includes(
                valor
            )
        ) {

            actuales.push(
                valor
            );

        }


        setter(
            actuales
        );


        input.value =
            "";


        renderTags(
            containerId,
            actuales,
            setter
        );


        input.focus();

    }


    boton.addEventListener(
        "click",
        agregar
    );


    input.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Enter"
            ) {

                evento.preventDefault();

                agregar();

            }

        }
    );

}


configurarTagInput(

    "specialty-input",

    "add-specialty",

    "specialty-tags",

    () =>
        especialidadesActuales,

    nuevo =>
        especialidadesActuales =
            nuevo

);


configurarTagInput(

    "allergy-input",

    "add-allergy",

    "allergy-tags",

    () =>
        alergiasActuales,

    nuevo =>
        alergiasActuales =
            nuevo

);


configurarTagInput(

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
RENDER TODOS LOS TAGS
========================================= */

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
NUEVO INTEGRANTE
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


    modalTitle.textContent =
        "NUEVO INTEGRANTE";


    photoPreview.src =
        "./img/logo.jpg";


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";


    renderTodoTags();


    modal.classList.add(
        "open"
    );

}


document
    .getElementById(
        "new-member"
    )
    .addEventListener(
        "click",
        abrirNuevo
    );


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
                .map(
                    mayusculas
                )
            :
            [];


    alergiasActuales =
        Array.isArray(
            persona.alergias
        )
            ?
            persona.alergias
                .map(
                    mayusculas
                )
            :
            [];


    afiliacionesActuales =
        Array.isArray(
            persona.afiliaciones
        )
            ?
            persona.afiliaciones
                .map(
                    mayusculas
                )
            :
            [];


    modalTitle.textContent =
        `EDITAR ${persona.id}`;


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
        persona.donanteSangre ===
        true;


    document.getElementById(
        "member-organ-donor"
    ).checked =
        persona.donanteOrganos ===
        true;


    document.getElementById(
        "member-public-emergency"
    ).checked =
        persona.publicarEmergencia ===
        true;


    document.getElementById(
        "member-photo"
    ).value =
        "";


    photoPreview.src =
        fotoActual
        ||
        "./img/logo.jpg";


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";


    renderTodoTags();


    modal.classList.add(
        "open"
    );

}


/* =========================================
CERRAR MODAL
========================================= */

function cerrarModal() {

    modal.classList.remove(
        "open"
    );


    form.reset();


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


    document.getElementById(
        "member-id"
    ).disabled =
        false;


    photoPreview.src =
        "./img/logo.jpg";


    formMessage.textContent =
        "";


    renderTodoTags();

}


document
    .getElementById(
        "close-modal"
    )
    .addEventListener(
        "click",
        cerrarModal
    );


document
    .getElementById(
        "cancel-button"
    )
    .addEventListener(
        "click",
        cerrarModal
    );


modal.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            modal
        ) {

            cerrarModal();

        }

    }
);


/* =========================================
PREVIEW FOTO
========================================= */

document
    .getElementById(
        "member-photo"
    )
    .addEventListener(
        "change",
        evento => {

            const archivo =
                evento.target
                    .files[0];


            if (
                !archivo
            ) {

                return;

            }


            const tipos =
                [

                    "image/jpeg",
                    "image/png",
                    "image/webp"

                ];


            if (
                !tipos.includes(
                    archivo.type
                )
            ) {

                alert(
                    "LA FOTO DEBE SER JPG, PNG O WEBP."
                );


                evento.target.value =
                    "";

                return;

            }


            if (
                archivo.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "LA FOTO NO PUEDE SUPERAR 5 MB."
                );


                evento.target.value =
                    "";

                return;

            }


            photoPreview.src =
                URL.createObjectURL(
                    archivo
                );

        }
    );


/* =========================================
CLOUDINARY
========================================= */

async function subirFotoCloudinary(
    archivo
) {

    const formData =
        new FormData();


    formData.append(
        "file",
        archivo
    );


    formData.append(
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
                    formData

            }

        );


    const datos =
        await respuesta.json();


    if (
        !respuesta.ok
    ) {

        throw new Error(

            datos?.error?.message

            ||

            "NO SE PUDO SUBIR LA FOTO."

        );

    }


    if (
        !datos.secure_url
    ) {

        throw new Error(
            "CLOUDINARY NO DEVOLVIÓ LA URL DE LA FOTO."
        );

    }


    return datos.secure_url;

}


/* =========================================
GUARDAR
========================================= */

form.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        saveButton.disabled =
            true;


        saveButton.textContent =
            "GUARDANDO...";


        formMessage.textContent =
            "";


        formMessage.className =
            "form-message";


        try {

            const id =
                integranteEditando
                ||
                mayusculas(
                    document.getElementById(
                        "member-id"
                    ).value
                );


            if (
                !/^SAR-\d+$/.test(
                    id
                )
            ) {

                throw new Error(
                    "EL ID DEBE TENER FORMATO SAR-001."
                );

            }


            if (
                !integranteEditando
            ) {

                const existente =
                    await getDoc(
                        doc(
                            db,
                            "integrantes",
                            id
                        )
                    );


                if (
                    existente.exists()
                ) {

                    throw new Error(
                        `YA EXISTE EL INTEGRANTE ${id}.`
                    );

                }

            }


            let fotoUrl =
                fotoActual;


            const archivo =
                document.getElementById(
                    "member-photo"
                )
                    .files[0];


            if (
                archivo
            ) {

                formMessage.textContent =
                    "SUBIENDO FOTO...";


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
                        .map(
                            mayusculas
                        ),

                alergias:
                    alergiasActuales
                        .map(
                            mayusculas
                        ),

                afiliaciones:
                    afiliacionesActuales
                        .map(
                            mayusculas
                        ),

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
                    fotoUrl
                    ||
                    "",

                actualizado:
                    serverTimestamp()

            };


            if (
                !integranteEditando
            ) {

                datos.creado =
                    serverTimestamp();

            }


            await setDoc(

                doc(
                    db,
                    "integrantes",
                    id
                ),

                datos,

                {
                    merge:
                        true
                }

            );


            formMessage.textContent =
                "GUARDADO CORRECTAMENTE.";


            formMessage.className =
                "form-message success";


            await cargarIntegrantes();


            setTimeout(
                cerrarModal,
                500
            );


        } catch (error) {

            console.error(
                error
            );


            formMessage.textContent =
                error.message
                ||
                "ERROR AL GUARDAR.";


            formMessage.className =
                "form-message error";


        } finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "GUARDAR";

        }

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

            "SI SOLAMENTE DEJÓ DE PERTENECER AL SAR, " +

            "ES MEJOR CAMBIAR SU ESTADO A INACTIVO."

        );


    if (
        !confirmar
    ) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "integrantes",
                persona.id
            )
        );


        await cargarIntegrantes();


    } catch (error) {

        console.error(
            error
        );


        alert(
            `NO SE PUDO ELIMINAR: ${error.message}`
        );

    }

}


/* =========================================
SELECCIONAR TODOS
========================================= */

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
                    check => {

                        check.checked =
                            true;

                    }
                );

        }
    );


/* =========================================
LIMPIAR SELECCIÓN
========================================= */

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
                    check => {

                        check.checked =
                            false;

                    }
                );

        }
    );


/* =========================================
IMPRIMIR VARIOS
========================================= */

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
                seleccionados.length ===
                0
            ) {

                alert(
                    "SELECCIONÁ AL MENOS UN INTEGRANTE."
                );

                return;

            }


            imprimirPersonas(
                seleccionados
            );

        }
    );


/* =========================================
IMPRIMIR
========================================= */

function imprimirPersonas(
    personas
) {

    const activas =
        personas.filter(
            persona =>

                String(
                    persona.estado
                    ||
                    ""
                )
                    .toLowerCase()
                    .trim()

                ===
                "activo"
        );


    if (
        activas.length ===
        0
    ) {

        alert(
            "NO HAY INTEGRANTES ACTIVOS PARA IMPRIMIR."
        );

        return;

    }


    sessionStorage.setItem(

        "credencialesImprimir",

        JSON.stringify(
            activas
        )

    );


    window.open(
        "./imprimir.html",
        "_blank"
    );

}


/* =========================================
VER SITIO
========================================= */

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
