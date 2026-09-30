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


const inactive =
    document.getElementById(
        "inactive"
    );


const notFound =
    document.getElementById(
        "not-found"
    );


const parametros =
    new URLSearchParams(
        window.location.search
    );


const id =
    String(
        parametros.get("id")
        ||
        ""
    )
        .trim()
        .toUpperCase();


async function cargar() {

    if (!id) {

        mostrarNoRegistrado();

        return;

    }


    try {

        const resultado =
            await getDoc(
                doc(
                    db,
                    "integrantes",
                    id
                )
            );


        if (!resultado.exists()) {

            mostrarNoRegistrado();

            return;

        }


        const persona = {

            id:
                resultado.id,

            ...resultado.data()

        };


        const estado =
            String(
                persona.estado
                ||
                "inactivo"
            )
                .toLowerCase()
                .trim();


        if (
            estado !== "activo"
        ) {

            mostrarInactivo(
                persona
            );

            return;

        }


        mostrarActivo(
            persona
        );


    } catch (error) {

        console.error(error);

        mostrarNoRegistrado();

    }

}


function ocultarTodo() {

    loading.style.display =
        "none";

    profile.style.display =
        "none";

    inactive.style.display =
        "none";

    notFound.style.display =
        "none";

}


function mostrarNoRegistrado() {

    ocultarTodo();


    notFound.style.display =
        "block";


    document.getElementById(
        "not-found-id"
    ).textContent =
        id
        ||
        "IDENTIFICACIÓN NO ESPECIFICADA";


    document.title =
        "Usuario no registrado | SAR Argentina";

}


function mostrarInactivo(
    persona
) {

    ocultarTodo();


    inactive.style.display =
        "block";


    document.getElementById(
        "inactive-id"
    ).textContent =
        persona.id;


    document.getElementById(
        "inactive-name"
    ).textContent =
        persona.nombre
        ||
        "";


    document.title =
        "Credencial no vigente | SAR Argentina";

}


function mostrarActivo(
    persona
) {

    ocultarTodo();


    profile.style.display =
        "block";


    const foto =
        persona.fotoUrl
        ||
        "./img/logo.jpg";


    const imagen =
        document.getElementById(
            "profile-photo"
        );


    imagen.src =
        foto;


    imagen.onerror =
        () => {

            imagen.src =
                "./img/logo.jpg";

        };


    document.getElementById(
        "profile-id"
    ).textContent =
        persona.id;


    document.getElementById(
        "profile-name"
    ).textContent =
        mayusculas(
            persona.nombre
        );


    const cargo =
        mayusculas(
            persona.cargo
        );


    const cargoElemento =
        document.getElementById(
            "profile-role"
        );


    cargoElemento.textContent =
        cargo;


    if (
        cargo === "COMANDANTE"
    ) {

        cargoElemento.classList.add(
            "commander-role"
        );

    }


    campo(
        "dni-box",
        "dni",
        persona.dni
    );


    campo(
        "blood-box",
        "blood",
        persona.grupoSanguineo
    );


    campo(
        "delegation-box",
        "delegation",
        persona.delegacion
    );


    campo(
        "entry-box",
        "entry",
        persona.ingreso
    );


    mostrarTags(
        "specialties-section",
        "specialties",
        persona.especialidades
    );


    mostrarTags(
        "affiliations-section",
        "affiliations",
        persona.afiliaciones
    );


    mostrarEmergencia(
        persona
    );


    document.title =
        `${mayusculas(persona.nombre)} | SAR Argentina`;

}


function mostrarEmergencia(
    persona
) {

    const seccion =
        document.getElementById(
            "emergency-section"
        );


    if (
        persona.publicarEmergencia
        !== true
    ) {

        seccion.style.display =
            "none";

        return;

    }


    seccion.style.display =
        "block";


    const alergias =
        Array.isArray(
            persona.alergias
        )
            ?
            persona.alergias
                .map(mayusculas)
            :
            [];


    document.getElementById(
        "allergies-line"
    ).textContent =
        alergias.length
            ?
            `ALERGIAS: ${alergias.join(", ")}`
            :
            "ALERGIAS: NO INFORMADAS";


    document.getElementById(
        "blood-donor-line"
    ).textContent =
        persona.donanteSangre === true
            ?
            "DONANTE DE SANGRE: SÍ"
            :
            "DONANTE DE SANGRE: NO / NO INFORMADO";


    document.getElementById(
        "organ-donor-line"
    ).textContent =
        persona.donanteOrganos === true
            ?
            "DONANTE DE ÓRGANOS / INCUCAI: SÍ"
            :
            "DONANTE DE ÓRGANOS / INCUCAI: NO / NO INFORMADO";

}


function mostrarTags(
    sectionId,
    containerId,
    valores
) {

    const seccion =
        document.getElementById(
            sectionId
        );


    const contenedor =
        document.getElementById(
            containerId
        );


    contenedor.innerHTML =
        "";


    if (
        !Array.isArray(
            valores
        )
        ||
        valores.length === 0
    ) {

        seccion.style.display =
            "none";

        return;

    }


    seccion.style.display =
        "block";


    valores.forEach(
        valor => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "tag";


            tag.textContent =
                mayusculas(
                    valor
                );


            contenedor.appendChild(
                tag
            );

        }
    );

}


function campo(
    cajaId,
    valorId,
    valor
) {

    const caja =
        document.getElementById(
            cajaId
        );


    if (
        valor === undefined
        ||
        valor === null
        ||
        String(valor).trim() === ""
    ) {

        caja.style.display =
            "none";

        return;

    }


    caja.style.display =
        "block";


    document.getElementById(
        valorId
    ).textContent =
        mayusculas(
            valor
        );

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


cargar();
