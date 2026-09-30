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



/* ==============================================
CLOUDINARY
============================================== */

const CLOUD_NAME =
    "hyvxppyb";

const UPLOAD_PRESET =
    "sar_integrantes";



async function subirFotoCloudinary(archivo) {

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


    if (!respuesta.ok) {

        let mensaje =
            "No se pudo subir la fotografía.";


        try {

            const errorCloudinary =
                await respuesta.json();


            if (
                errorCloudinary
                &&
                errorCloudinary.error
                &&
                errorCloudinary.error.message
            ) {

                mensaje =
                    errorCloudinary.error.message;

            }

        } catch (error) {

            console.error(error);

        }


        throw new Error(
            mensaje
        );

    }


    const resultado =
        await respuesta.json();


    if (!resultado.secure_url) {

        throw new Error(
            "Cloudinary no devolvió la URL de la imagen."
        );

    }


    return resultado.secure_url;

}



/* ==============================================
ELEMENTOS
============================================== */

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



/* ==============================================
VARIABLES
============================================== */

let integrantes = [];

let seleccionados =
    new Set();

let editandoId =
    null;

let fotoActual =
    "";



/* ==============================================
SEGURIDAD ADMIN
============================================== */

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

        return null;

    }


    const datos =
        documento.data();


    if (
        datos.rol !== "comandante"
        ||
        datos.activo !== true
    ) {

        return null;

    }


    return datos;

}



/* ==============================================
SESIÓN
============================================== */

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

            const datos =
                await comprobarComandante(
                    usuario
                );


            if (!datos) {

                await signOut(auth);


                window.location.replace(
                    "./login.html"
                );

                return;

            }


            document.getElementById(
                "admin-welcome"
            ).textContent =
                `Sesión iniciada como ${
                    datos.nombre ||
                    usuario.email ||
                    "Comandante"
                }.`;


            loading.style.display =
                "none";


            adminContent.style.display =
                "block";


            await cargarIntegrantes();


        } catch (error) {

            console.error(
                "Error verificando permisos:",
                error
            );


            await signOut(auth);


            window.location.replace(
                "./login.html"
            );

        }

    }
);



/* ==============================================
CARGAR INTEGRANTES
============================================== */

async function cargarIntegrantes() {

    membersGrid.innerHTML = `
        <div class="empty">
            Cargando integrantes...
        </div>
    `;


    try {

        const consulta =
            await getDocs(
                collection(
                    db,
                    "integrantes"
                )
            );


        integrantes =
            [];


        consulta.forEach(
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
                No se pudieron cargar los integrantes.
            </div>
        `;

    }

}



/* ==============================================
MOSTRAR INTEGRANTES
============================================== */

function renderIntegrantes(lista) {

    membersGrid.innerHTML =
        "";


    if (
        lista.length === 0
    ) {

        membersGrid.innerHTML = `
            <div class="empty">
                No hay integrantes para mostrar.
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
                        class="member-photo"
                        src="${foto}"
                        alt=""
                        loading="lazy"
                        onerror="this.src='./img/logo.jpg'"
                    >


                    <div>

                        <div class="member-id">
                            ${persona.id}
                        </div>


                        <h3 class="member-name">
                            ${persona.nombre || "Sin nombre"}
                        </h3>


                        <div class="member-role">
                            ${persona.cargo || "Sin cargo"}
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
                        class="action-button edit-button"
                        data-edit="${persona.id}"
                        type="button"
                    >
                        Editar
                    </button>


                    <button
                        class="action-button view-button"
                        data-view="${persona.id}"
                        type="button"
                    >
                        Ver ficha
                    </button>


                    <button
                        class="action-button print-one-button"
                        data-print="${persona.id}"
                        type="button"
                    >
                        Imprimir
                    </button>


                    <button
                        class="action-button delete-button"
                        data-delete="${persona.id}"
                        type="button"
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


    conectarEventosTarjetas();

}



/* ==============================================
EVENTOS TARJETAS
============================================== */

function conectarEventosTarjetas() {


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

                        const id =
                            boton.dataset.view;


                        window.open(
                            `./?id=${encodeURIComponent(id)}`,
                            "_blank"
                        );

                    }
                );

            }
        );

}



/* ==============================================
CONTADOR
============================================== */

function actualizarContador() {

    selectedCounter.textContent =
        `${seleccionados.size} seleccionada${
            seleccionados.size !== 1
                ? "s"
                : ""
        }`;

}



/* ==============================================
BUSCADOR
============================================== */

searchInput.addEventListener(
    "input",
    () => {

        const texto =
            searchInput.value
                .trim()
                .toLowerCase();


        const filtrados =
            integrantes.filter(
                persona => {

                    return (

                        (
                            persona.id
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.nombre
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.cargo
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.dni
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.delegacion
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                    );

                }
            );


        renderIntegrantes(
            filtrados
        );

    }
);



/* ==============================================
SELECCIONAR TODAS
============================================== */

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



/* ==============================================
QUITAR SELECCIÓN
============================================== */

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



/* ==============================================
IMPRIMIR SELECCIONADAS
============================================== */

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



function imprimirIds(ids) {

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



/* ==============================================
NUEVO INTEGRANTE
============================================== */

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


            modalTitle.textContent =
                "Nuevo integrante";


            memberForm.reset();


            const idInput =
                document.getElementById(
                    "member-id"
                );


            idInput.disabled =
                false;


            photoPreview.src =
                "./img/logo.jpg";


            formMessage.textContent =
                "";


            formMessage.className =
                "form-message";


            modal.classList.add(
                "show"
            );

        }
    );



/* ==============================================
EDITAR
============================================== */

function abrirEditar(id) {

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


    photoPreview.src =
        fotoActual
        ||
        "./img/logo.jpg";


    document.getElementById(
        "member-photo"
    ).value =
        "";


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";


    modal.classList.add(
        "show"
    );

}



/* ==============================================
PREVISUALIZAR FOTO
============================================== */

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


            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !tiposPermitidos.includes(
                    archivo.type
                )
            ) {

                alert(
                    "La foto debe ser JPG, PNG o WEBP."
                );


                event.target.value =
                    "";


                return;

            }


            const maximo =
                5 * 1024 * 1024;


            if (
                archivo.size > maximo
            ) {

                alert(
                    "La imagen no puede superar los 5 MB."
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



/* ==============================================
GUARDAR
============================================== */

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


        formMessage.className =
            "form-message";


        let id;


        if (
            editandoId
        ) {

            id =
                editandoId;

        } else {

            id =
                document
                    .getElementById(
                        "member-id"
                    )
                    .value
                    .trim()
                    .toUpperCase();

        }


        if (!id) {

            mostrarError(
                "Ingresá un ID SAR."
            );

            finalizarGuardado();

            return;

        }


        if (
            !/^SAR-\d+$/i.test(id)
        ) {

            mostrarError(
                "El ID debe tener un formato como SAR-0001."
            );

            finalizarGuardado();

            return;

        }


        try {

            /*
             * Evita reemplazar accidentalmente
             * otro integrante al crear uno nuevo.
             */

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

                    mostrarError(
                        `Ya existe un integrante con ID ${id}.`
                    );


                    finalizarGuardado();

                    return;

                }

            }


            let fotoUrl =
                fotoActual || "";


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
                        texto =>
                            texto.trim()
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
                    fotoUrl,

                actualizado:
                    serverTimestamp()

            };


            /*
             * Solo agrega fecha de creación
             * cuando el integrante es nuevo.
             */

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
                "Cambios guardados correctamente.";


            formMessage.className =
                "form-message success";


            await cargarIntegrantes();


            setTimeout(
                () => {

                    cerrarModal();

                },
                700
            );


        } catch (error) {

            console.error(
                "Error guardando integrante:",
                error
            );


            mostrarError(
                error.message
                ||
                "No se pudieron guardar los cambios."
            );

        } finally {

            finalizarGuardado();

        }

    }
);



function mostrarError(texto) {

    formMessage.textContent =
        texto;


    formMessage.className =
        "form-message error";

}



function finalizarGuardado() {

    saveButton.disabled =
        false;


    saveButton.textContent =
        "Guardar cambios";

}



/* ==============================================
ELIMINAR
============================================== */

async function eliminarIntegrante(id) {

    const confirmar =
        confirm(
            `¿Seguro que querés eliminar ${id}?\n\nSi solamente dejó de pertenecer al SAR, es mejor editarlo y ponerlo INACTIVO.`
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
            "No se pudo eliminar el integrante."
        );

    }

}



/* ==============================================
MODAL
============================================== */

function cerrarModal() {

    modal.classList.remove(
        "show"
    );


    editandoId =
        null;


    fotoActual =
        "";


    memberForm.reset();


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



/* ==============================================
CERRAR SESIÓN
============================================== */

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


                window.location.replace(
                    "./login.html"
                );


            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "No se pudo cerrar la sesión."
                );

            }

        }
    );



/* ==============================================
SITIO PÚBLICO
============================================== */

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
