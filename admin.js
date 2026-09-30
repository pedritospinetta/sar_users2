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


/* =========================================
CLOUDINARY
========================================= */

const CLOUD_NAME =
    "hyvxppyb";


const UPLOAD_PRESET =
    "sar_integrantes";


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
                method: "POST",
                body: formData
            }
        );


    const datos =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            datos?.error?.message
            ||
            "No se pudo subir la fotografía."
        );

    }


    if (!datos.secure_url) {

        throw new Error(
            "Cloudinary no devolvió la URL de la fotografía."
        );

    }


    return datos.secure_url;

}


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


const searchInput =
    document.getElementById(
        "search-input"
    );


const selectedCounter =
    document.getElementById(
        "selected-counter"
    );


const modal =
    document.getElementById(
        "member-modal"
    );


const memberForm =
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
VARIABLES
========================================= */

let integrantes =
    [];


let seleccionados =
    new Set();


let editandoId =
    null;


let fotoActual =
    "";


/* =========================================
VERIFICAR COMANDANTE
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


    if (!documento.exists()) {

        throw new Error(
            "No existe el registro administrativo de este usuario."
        );

    }


    const datos =
        documento.data();


    if (
        datos.rol !== "comandante"
    ) {

        throw new Error(
            "El usuario no tiene rol de comandante."
        );

    }


    if (
        datos.activo !== true
    ) {

        throw new Error(
            "La cuenta administrativa está inactiva."
        );

    }


    return datos;

}


/* =========================================
SESIÓN
========================================= */

let authRespondio =
    false;


setTimeout(
    () => {

        if (!authRespondio) {

            loading.textContent =
                "Firebase está tardando en verificar la sesión. Recargá la página.";

            loading.className =
                "loading error";

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

            loading.textContent =
                "Verificando permisos del comandante...";


            const datos =
                await comprobarComandante(
                    usuario
                );


            document.getElementById(
                "admin-welcome"
            ).textContent =
                `Sesión iniciada como ${
                    datos.nombre
                    ||
                    usuario.email
                    ||
                    "Comandante"
                }.`;


            loading.style.display =
                "none";


            adminContent.style.display =
                "block";


            await cargarIntegrantes();


        } catch (error) {

            console.error(
                "Error verificando administrador:",
                error
            );


            loading.textContent =
                `Error: ${error.message}`;


            loading.className =
                "loading error";

        }

    }
);


/* =========================================
CARGAR INTEGRANTES
========================================= */

async function cargarIntegrantes() {

    membersGrid.innerHTML = `
        <div class="empty">
            Cargando integrantes...
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
            [];


        resultado.forEach(
            documento => {

                integrantes.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
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


        renderIntegrantes(
            integrantes
        );


    } catch (error) {

        console.error(
            "Error cargando integrantes:",
            error
        );


        membersGrid.innerHTML = `
            <div class="empty">
                Error cargando integrantes:
                ${error.message}
            </div>
        `;

    }

}


/* =========================================
RENDER
========================================= */

function renderIntegrantes(
    lista
) {

    membersGrid.innerHTML =
        "";


    if (
        lista.length === 0
    ) {

        membersGrid.innerHTML = `
            <div class="empty">
                No hay integrantes registrados.
            </div>
        `;

        return;

    }


    lista.forEach(
        persona => {

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
                "member-card";


            card.innerHTML = `

                <div class="select-area">

                    <input
                        type="checkbox"
                        class="print-checkbox"
                        data-id="${persona.id}"
                        ${
                            seleccionados.has(
                                persona.id
                            )
                            ? "checked"
                            : ""
                        }
                    >

                </div>


                <div class="member-main">

                    <img
                        src="${foto}"
                        class="member-photo"
                        alt=""
                        onerror="this.src='./img/logo.jpg'"
                    >


                    <div>

                        <div class="member-id">
                            ${persona.id}
                        </div>


                        <h3 class="member-name">
                            ${
                                persona.nombre
                                ||
                                "Sin nombre"
                            }
                        </h3>


                        <div class="member-role">
                            ${
                                persona.cargo
                                ||
                                "Sin cargo"
                            }
                        </div>


                        <div class="status ${estado}">

                            <span class="status-dot"></span>

                            ${
                                estado === "activo"
                                ? "ACTIVO"
                                : "INACTIVO"
                            }

                        </div>

                    </div>

                </div>


                <div class="member-actions">

                    <button
                        type="button"
                        class="action-button edit-button"
                        data-edit="${persona.id}"
                    >
                        Editar
                    </button>


                    <button
                        type="button"
                        class="action-button view-button"
                        data-view="${persona.id}"
                    >
                        Ver ficha
                    </button>


                    <button
                        type="button"
                        class="action-button print-one-button"
                        data-print="${persona.id}"
                    >
                        Imprimir
                    </button>


                    <button
                        type="button"
                        class="action-button delete-button"
                        data-delete="${persona.id}"
                    >
                        Eliminar
                    </button>

                </div>

            `;


            membersGrid.appendChild(
                card
            );

        }
    );


    conectarEventos();

}


/* =========================================
EVENTOS CARDS
========================================= */

function conectarEventos() {


    document
        .querySelectorAll(
            ".print-checkbox"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    () => {

                        const id =
                            checkbox.dataset.id;


                        if (
                            checkbox.checked
                        ) {

                            seleccionados.add(
                                id
                            );

                        } else {

                            seleccionados.delete(
                                id
                            );

                        }


                        actualizarContador();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-edit]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        abrirEditar(
                            boton.dataset.edit
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        eliminarIntegrante(
                            boton.dataset.delete
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-print]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        imprimirIds([
                            boton.dataset.print
                        ]);

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-view]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        window.open(
                            `./?id=${encodeURIComponent(
                                boton.dataset.view
                            )}`,
                            "_blank"
                        );

                    }
                );

            }
        );

}


/* =========================================
BUSCAR
========================================= */

searchInput.addEventListener(
    "input",
    () => {

        const texto =
            searchInput.value
                .trim()
                .toLowerCase();


        const encontrados =
            integrantes.filter(
                persona => {

                    const contenido = `
                        ${persona.id || ""}
                        ${persona.nombre || ""}
                        ${persona.cargo || ""}
                        ${persona.dni || ""}
                        ${persona.delegacion || ""}
                    `.toLowerCase();


                    return contenido.includes(
                        texto
                    );

                }
            );


        renderIntegrantes(
            encontrados
        );

    }
);


/* =========================================
SELECCIÓN
========================================= */

function actualizarContador() {

    selectedCounter.textContent =
        `${seleccionados.size} seleccionada${
            seleccionados.size !== 1
            ? "s"
            : ""
        }`;

}


document
    .getElementById(
        "select-all"
    )
    .addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".print-checkbox"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            true;


                        seleccionados.add(
                            checkbox.dataset.id
                        );

                    }
                );


            actualizarContador();

        }
    );


document
    .getElementById(
        "clear-selection"
    )
    .addEventListener(
        "click",
        () => {

            seleccionados.clear();


            document
                .querySelectorAll(
                    ".print-checkbox"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            false;

                    }
                );


            actualizarContador();

        }
    );


document
    .getElementById(
        "print-selected"
    )
    .addEventListener(
        "click",
        () => {

            if (
                seleccionados.size === 0
            ) {

                alert(
                    "Seleccioná al menos una credencial."
                );

                return;

            }


            imprimirIds(
                Array.from(
                    seleccionados
                )
            );

        }
    );


function imprimirIds(
    ids
) {

    const personas =
        integrantes.filter(
            persona =>
                ids.includes(
                    persona.id
                )
        );


    sessionStorage.setItem(
        "credencialesImprimir",
        JSON.stringify(
            personas
        )
    );


    window.open(
        "./imprimir.html",
        "_blank"
    );

}


/* =========================================
NUEVO
========================================= */

document
    .getElementById(
        "new-member-button"
    )
    .addEventListener(
        "click",
        () => {

            editandoId =
                null;


            fotoActual =
                "";


            memberForm.reset();


            modalTitle.textContent =
                "Nuevo integrante";


            document.getElementById(
                "member-id"
            ).disabled =
                false;


            photoPreview.src =
                "./img/logo.jpg";


            formMessage.textContent =
                "";


            modal.classList.add(
                "show"
            );

        }
    );


/* =========================================
EDITAR
========================================= */

function abrirEditar(
    id
) {

    const persona =
        integrantes.find(
            integrante =>
                integrante.id === id
        );


    if (!persona) {

        return;

    }


    editandoId =
        id;


    fotoActual =
        persona.fotoUrl
        ||
        "";


    modalTitle.textContent =
        `Editar ${id}`;


    const idInput =
        document.getElementById(
            "member-id"
        );


    idInput.value =
        id;


    idInput.disabled =
        true;


    document.getElementById(
        "member-name"
    ).value =
        persona.nombre || "";


    document.getElementById(
        "member-dni"
    ).value =
        persona.dni || "";


    document.getElementById(
        "member-role"
    ).value =
        persona.cargo || "";


    document.getElementById(
        "member-status"
    ).value =
        persona.estado || "activo";


    document.getElementById(
        "member-delegation"
    ).value =
        persona.delegacion || "";


    document.getElementById(
        "member-blood"
    ).value =
        persona.grupoSanguineo || "";


    document.getElementById(
        "member-entry"
    ).value =
        persona.ingreso || "";


    document.getElementById(
        "member-specialties"
    ).value =
        Array.isArray(
            persona.especialidades
        )
        ? persona.especialidades.join(
            ", "
        )
        : "";


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


    modal.classList.add(
        "show"
    );

}


/* =========================================
PREVIEW FOTO
========================================= */

document
    .getElementById(
        "member-photo"
    )
    .addEventListener(
        "change",
        event => {

            const archivo =
                event.target.files[0];


            if (!archivo) {

                return;

            }


            const permitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !permitidos.includes(
                    archivo.type
                )
            ) {

                alert(
                    "La imagen debe ser JPG, PNG o WEBP."
                );


                event.target.value =
                    "";


                return;

            }


            if (
                archivo.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "La imagen no puede superar 5 MB."
                );


                event.target.value =
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
GUARDAR
========================================= */

memberForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Guardando...";


        formMessage.textContent =
            "";


        try {

            const id =
                editandoId
                ||
                document
                    .getElementById(
                        "member-id"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            if (
                !/^SAR-\d+$/i.test(
                    id
                )
            ) {

                throw new Error(
                    "El ID debe tener formato SAR-0001."
                );

            }


            if (!editandoId) {

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
                        `Ya existe ${id}.`
                    );

                }

            }


            let fotoUrl =
                fotoActual;


            const archivo =
                document
                    .getElementById(
                        "member-photo"
                    )
                    .files[0];


            if (archivo) {

                formMessage.textContent =
                    "Subiendo fotografía...";


                fotoUrl =
                    await subirFotoCloudinary(
                        archivo
                    );

            }


            const especialidades =
                document
                    .getElementById(
                        "member-specialties"
                    )
                    .value
                    .split(",")
                    .map(
                        valor =>
                            valor.trim()
                    )
                    .filter(Boolean);


            const datos = {

                nombre:
                    document
                        .getElementById(
                            "member-name"
                        )
                        .value
                        .trim(),

                dni:
                    document
                        .getElementById(
                            "member-dni"
                        )
                        .value
                        .trim(),

                cargo:
                    document
                        .getElementById(
                            "member-role"
                        )
                        .value
                        .trim(),

                estado:
                    document
                        .getElementById(
                            "member-status"
                        )
                        .value,

                delegacion:
                    document
                        .getElementById(
                            "member-delegation"
                        )
                        .value
                        .trim(),

                grupoSanguineo:
                    document
                        .getElementById(
                            "member-blood"
                        )
                        .value
                        .trim(),

                ingreso:
                    document
                        .getElementById(
                            "member-entry"
                        )
                        .value
                        .trim(),

                especialidades:
                    especialidades,

                fotoUrl:
                    fotoUrl || "",

                actualizado:
                    serverTimestamp()

            };


            if (!editandoId) {

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
                    merge: true
                }
            );


            formMessage.textContent =
                "Guardado correctamente.";


            formMessage.className =
                "form-message success";


            await cargarIntegrantes();


            setTimeout(
                () => {

                    cerrarModal();

                },
                600
            );


        } catch (error) {

            console.error(
                error
            );


            formMessage.textContent =
                error.message;


            formMessage.className =
                "form-message error";

        } finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Guardar cambios";

        }

    }
);


/* =========================================
ELIMINAR
========================================= */

async function eliminarIntegrante(
    id
) {

    const confirmar =
        confirm(
            `¿Eliminar ${id}?\n\nSi solamente dejó de pertenecer al SAR, conviene ponerlo INACTIVO.`
        );


    if (!confirmar) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "integrantes",
                id
            )
        );


        seleccionados.delete(
            id
        );


        await cargarIntegrantes();


        actualizarContador();


    } catch (error) {

        console.error(
            error
        );


        alert(
            `No se pudo eliminar: ${error.message}`
        );

    }

}


/* =========================================
MODAL
========================================= */

function cerrarModal() {

    modal.classList.remove(
        "show"
    );


    memberForm.reset();


    editandoId =
        null;


    fotoActual =
        "";


    document.getElementById(
        "member-id"
    ).disabled =
        false;


    photoPreview.src =
        "./img/logo.jpg";

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
    event => {

        if (
            event.target === modal
        ) {

            cerrarModal();

        }

    }
);


/* =========================================
VER SITIO
========================================= */

document
    .getElementById(
        "go-public"
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
