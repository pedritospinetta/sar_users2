import {
    auth,
    db,
    storage
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


import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";


const loading =
    document.getElementById("loading");

const adminContent =
    document.getElementById("admin-content");

const membersGrid =
    document.getElementById("members-grid");

const searchInput =
    document.getElementById("search-input");

const selectedCounter =
    document.getElementById("selected-counter");

const modal =
    document.getElementById("member-modal");

const memberForm =
    document.getElementById("member-form");

const modalTitle =
    document.getElementById("modal-title");

const formMessage =
    document.getElementById("form-message");

const photoPreview =
    document.getElementById("photo-preview");


let integrantes = [];

let seleccionados =
    new Set();

let editandoId =
    null;

let fotoActual =
    "";



async function comprobarComandante(usuario) {

    const refUsuario =
        doc(
            db,
            "usuarios",
            usuario.uid
        );

    const snap =
        await getDoc(refUsuario);

    if (!snap.exists()) {
        return null;
    }

    const datos =
        snap.data();

    if (
        datos.rol !== "comandante"
        ||
        datos.activo !== true
    ) {
        return null;
    }

    return datos;
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
                `Sesión iniciada como ${datos.nombre || "Comandante"}.`;


            loading.style.display =
                "none";

            adminContent.style.display =
                "block";


            await cargarIntegrantes();


        } catch (error) {

            console.error(error);

            await signOut(auth);

            window.location.replace(
                "./login.html"
            );

        }

    }
);



async function cargarIntegrantes() {

    membersGrid.innerHTML =
        `<div class="empty">Cargando integrantes...</div>`;


    try {

        const consulta =
            await getDocs(
                collection(
                    db,
                    "integrantes"
                )
            );


        integrantes = [];


        consulta.forEach(
            documento => {

                integrantes.push({
                    id: documento.id,
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

        console.error(error);

        membersGrid.innerHTML = `
            <div class="empty">
                No se pudieron cargar los integrantes.
            </div>
        `;

    }

}



function renderIntegrantes(lista) {

    membersGrid.innerHTML =
        "";


    if (lista.length === 0) {

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
                        ${seleccionados.has(persona.id) ? "checked" : ""}
                    >

                </div>


                <div class="member-main">

                    <img
                        class="member-photo"
                        src="${foto}"
                        alt="${persona.nombre || persona.id}"
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
                    >
                        Editar
                    </button>


                    <a
                        class="action-button view-button"
                        href="./integrantes/${persona.id}"
                        target="_blank"
                    >
                        Ver ficha
                    </a>


                    <button
                        class="action-button print-one-button"
                        data-print="${persona.id}"
                    >
                        Imprimir
                    </button>


                    <button
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


    conectarEventosTarjetas();

}



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


                        if (checkbox.checked) {

                            seleccionados.add(id);

                        } else {

                            seleccionados.delete(id);

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

}



function actualizarContador() {

    selectedCounter.textContent =
        `${seleccionados.size} seleccionada${seleccionados.size !== 1 ? "s" : ""}`;

}



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

                    );

                }
            );


        renderIntegrantes(
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

            const visibles =
                document.querySelectorAll(
                    ".print-checkbox"
                );


            visibles.forEach(
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
            ? persona.especialidades.join(", ")
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


    modal.classList.add(
        "show"
    );

}



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


            photoPreview.src =
                URL.createObjectURL(
                    archivo
                );

        }
    );



memberForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        formMessage.textContent =
            "Guardando...";

        formMessage.className =
            "form-message";


        let id =
            document
                .getElementById(
                    "member-id"
                )
                .value
                .trim()
                .toUpperCase();


        if (!id) {

            formMessage.textContent =
                "Ingresá un ID SAR.";

            formMessage.className =
                "form-message error";

            return;

        }


        try {

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


                const extension =
                    archivo.name
                        .split(".")
                        .pop();


                const fotoRef =
                    ref(
                        storage,
                        `integrantes/${id}/perfil.${extension}`
                    );


                await uploadBytes(
                    fotoRef,
                    archivo
                );


                fotoUrl =
                    await getDownloadURL(
                        fotoRef
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
                        item =>
                            item.trim()
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


            setTimeout(
                async () => {

                    modal.classList.remove(
                        "show"
                    );

                    await cargarIntegrantes();

                },
                500
            );


        } catch (error) {

            console.error(error);


            formMessage.textContent =
                "No se pudieron guardar los cambios.";

            formMessage.className =
                "form-message error";

        }

    }
);



async function eliminarIntegrante(id) {

    const confirmar =
        confirm(
            `¿Eliminar ${id} del registro?\n\nPara una baja normal conviene ponerlo INACTIVO en lugar de eliminarlo.`
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

        console.error(error);

        alert(
            "No se pudo eliminar el integrante."
        );

    }

}



function cerrarModal() {

    modal.classList.remove(
        "show"
    );

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



document
    .getElementById(
        "logout-button"
    )
    .addEventListener(
        "click",
        async () => {

            await signOut(
                auth
            );


            window.location.replace(
                "./login.html"
            );

        }
    );



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
