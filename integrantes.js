import {
    db
} from "./firebase-config.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const loading =
    document.getElementById(
        "loading"
    );


const profile =
    document.getElementById(
        "profile"
    );


const errorBox =
    document.getElementById(
        "error-box"
    );


const parametros =
    new URLSearchParams(
        window.location.search
    );


const id =
    (
        parametros.get("id")
        ||
        ""
    )
        .trim()
        .toUpperCase();



async function cargarIntegrante() {

    if (!id) {

        mostrarError();

        return;

    }


    try {

        const referencia =
            doc(
                db,
                "integrantes",
                id
            );


        const documento =
            await getDoc(
                referencia
            );


        if (!documento.exists()) {

            mostrarError();

            return;

        }


        const persona = {

            id:
                documento.id,

            ...documento.data()

        };


        mostrarPerfil(
            persona
        );


    } catch (error) {

        console.error(
            "Error consultando integrante:",
            error
        );


        mostrarError();

    }

}



function mostrarPerfil(
    persona
) {

    loading.style.display =
        "none";


    errorBox.style.display =
        "none";


    profile.style.display =
        "block";


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


    const profilePhoto =
        document.getElementById(
            "profile-photo"
        );


    profilePhoto.src =
        foto;


    profilePhoto.onerror =
        () => {

            profilePhoto.src =
                "./img/logo.jpg";

        };


    document.getElementById(
        "profile-id"
    ).textContent =
        persona.id;


    document.getElementById(
        "profile-name"
    ).textContent =
        persona.nombre
        ||
        "Sin nombre";


    document.getElementById(
        "profile-role"
    ).textContent =
        persona.cargo
        ||
        "Sin función";


    const status =
        document.getElementById(
            "profile-status"
        );


    status.className =
        `status-box ${estado}`;


    document.getElementById(
        "profile-status-text"
    ).textContent =
        estado === "activo"
            ? "MIEMBRO ACTIVO"
            : "MIEMBRO INACTIVO";


    if (
        estado === "inactivo"
    ) {

        document.getElementById(
            "inactive-warning"
        ).style.display =
            "block";

    }


    completarCampo(
        "profile-dni",
        "dni-card",
        persona.dni
    );


    completarCampo(
        "profile-blood",
        "blood-card",
        persona.grupoSanguineo
    );


    completarCampo(
        "profile-delegation",
        "delegation-card",
        persona.delegacion
    );


    completarCampo(
        "profile-entry",
        "entry-card",
        persona.ingreso
    );


    const specialtiesSection =
        document.getElementById(
            "specialties-section"
        );


    const specialtiesList =
        document.getElementById(
            "specialties-list"
        );


    specialtiesList.innerHTML =
        "";


    if (
        Array.isArray(
            persona.especialidades
        )
        &&
        persona.especialidades.length > 0
    ) {

        persona.especialidades.forEach(
            especialidad => {

                const chip =
                    document.createElement(
                        "span"
                    );


                chip.className =
                    "specialty";


                chip.textContent =
                    especialidad;


                specialtiesList.appendChild(
                    chip
                );

            }
        );

    } else {

        specialtiesSection.style.display =
            "none";

    }


    document.title =
        `${persona.nombre || persona.id} | SAR Argentina`;

}



function completarCampo(
    valorId,
    cardId,
    valor
) {

    const card =
        document.getElementById(
            cardId
        );


    if (
        valor === undefined
        ||
        valor === null
        ||
        String(valor).trim() === ""
    ) {

        card.style.display =
            "none";

        return;

    }


    document.getElementById(
        valorId
    ).textContent =
        valor;

}



function mostrarError() {

    loading.style.display =
        "none";


    profile.style.display =
        "none";


    errorBox.style.display =
        "block";

}



cargarIntegrante();
