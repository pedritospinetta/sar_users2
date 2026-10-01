import {
    db
} from "./firebase-config.js";


import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    runTransaction,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const SISTEMA_REF =
    doc(
        db,
        "configuracion",
        "sistema"
    );


const TIEMPO_VENCIMIENTO =
    5 * 60 * 1000;


let heartbeatInterval =
    null;


/* =========================================
OBTENER DATOS DEL USUARIO
========================================= */

export async function obtenerUsuarioSistema(
    usuario
) {

    if (!usuario) {

        return null;

    }


    const resultado =
        await getDoc(
            doc(
                db,
                "usuarios",
                usuario.uid
            )
        );


    if (!resultado.exists()) {

        return null;

    }


    return {

        uid:
            usuario.uid,

        email:
            usuario.email,

        ...resultado.data()

    };

}


/* =========================================
OBTENER ESTADO DEL SISTEMA
========================================= */

export async function obtenerEstadoSistema() {

    const resultado =
        await getDoc(
            SISTEMA_REF
        );


    if (!resultado.exists()) {

        return {

            modo:
                "online"

        };

    }


    const datos =
        resultado.data();


    if (
        datos.modo ===
        "online"
    ) {

        return datos;

    }


    const ultimaActividad =
        datos.ultimaActividad
            ?.toMillis?.();


    if (!ultimaActividad) {

        return {

            ...datos,

            modo:
                "online",

            vencido:
                true

        };

    }


    const vencido =
        Date.now() - ultimaActividad >
        TIEMPO_VENCIMIENTO;


    if (vencido) {

        return {

            ...datos,

            modo:
                "online",

            vencido:
                true

        };

    }


    return datos;

}


/* =========================================
TOMAR CONTROL DEL SISTEMA
========================================= */

export async function tomarControlSistema(
    usuarioSistema
) {

    if (!usuarioSistema) {

        throw new Error(
            "USUARIO NO VÁLIDO."
        );

    }


    const rol =
        usuarioSistema.rol;


    if (
        rol !== "developer"
        &&
        rol !== "comandante"
    ) {

        throw new Error(
            "ROL NO AUTORIZADO."
        );

    }


    return await runTransaction(
        db,
        async transaction => {

            const snapshot =
                await transaction.get(
                    SISTEMA_REF
                );


            let actual = {

                modo:
                    "online"

            };


            if (
                snapshot.exists()
            ) {

                actual =
                    snapshot.data();

            }


            let vencido =
                false;


            if (
                actual.modo !==
                "online"
            ) {

                const ultimaActividad =
                    actual.ultimaActividad
                        ?.toMillis?.();


                vencido =
                    !ultimaActividad

                    ||

                    Date.now() - ultimaActividad >
                    TIEMPO_VENCIMIENTO;

            }


            /* =====================================
            DEVELOPER TIENE PRIORIDAD
            ===================================== */

            if (
                rol ===
                "developer"
            ) {

                transaction.set(

                    SISTEMA_REF,

                    {

                        modo:
                            "developer",

                        propietarioUid:
                            usuarioSistema.uid,

                        propietarioRol:
                            "developer",

                        ultimaActividad:
                            serverTimestamp()

                    },

                    {
                        merge:
                            true
                    }

                );


                return {

                    permitido:
                        true,

                    modo:
                        "developer"

                };

            }


            /* =====================================
            COMANDANTE NO PUEDE ENTRAR
            SI HAY DEVELOPER ACTIVO
            ===================================== */

            if (
                actual.modo ===
                "developer"

                &&

                !vencido
            ) {

                return {

                    permitido:
                        false,

                    modo:
                        "developer"

                };

            }


            /* =====================================
            COMANDANTE TOMA CONTROL
            ===================================== */

            transaction.set(

                SISTEMA_REF,

                {

                    modo:
                        "comandante",

                    propietarioUid:
                        usuarioSistema.uid,

                    propietarioRol:
                        "comandante",

                    ultimaActividad:
                        serverTimestamp()

                },

                {
                    merge:
                        true
                }

            );


            return {

                permitido:
                    true,

                modo:
                    "comandante"

            };

        }
    );

}


/* =========================================
HEARTBEAT
========================================= */

export function iniciarHeartbeat(
    usuarioSistema
) {

    detenerHeartbeat();


    async function renovar() {

        try {

            const resultado =
                await getDoc(
                    SISTEMA_REF
                );


            if (
                !resultado.exists()
            ) {

                return;

            }


            const datos =
                resultado.data();


            if (
                datos.propietarioUid !==
                usuarioSistema.uid
            ) {

                detenerHeartbeat();

                return;

            }


            await updateDoc(

                SISTEMA_REF,

                {

                    ultimaActividad:
                        serverTimestamp()

                }

            );


        } catch (error) {

            console.error(
                "ERROR RENOVANDO BLOQUEO:",
                error
            );

        }

    }


    renovar();


    heartbeatInterval =
        setInterval(
            renovar,
            30000
        );

}


/* =========================================
DETENER HEARTBEAT
========================================= */

export function detenerHeartbeat() {

    if (
        heartbeatInterval
    ) {

        clearInterval(
            heartbeatInterval
        );


        heartbeatInterval =
            null;

    }

}


/* =========================================
LIBERAR SISTEMA
========================================= */

export async function liberarSistema(
    usuarioSistema
) {

    detenerHeartbeat();


    if (!usuarioSistema) {

        return;

    }


    try {

        await runTransaction(
            db,
            async transaction => {

                const resultado =
                    await transaction.get(
                        SISTEMA_REF
                    );


                if (
                    !resultado.exists()
                ) {

                    return;

                }


                const datos =
                    resultado.data();


                if (
                    datos.propietarioUid !==
                    usuarioSistema.uid
                ) {

                    return;

                }


                transaction.set(

                    SISTEMA_REF,

                    {

                        modo:
                            "online",

                        propietarioUid:
                            "",

                        propietarioRol:
                            "",

                        ultimaActividad:
                            serverTimestamp()

                    },

                    {
                        merge:
                            true
                    }

                );

            }
        );


    } catch (error) {

        console.error(
            "NO SE PUDO LIBERAR EL SISTEMA:",
            error
        );

    }

}


/* =========================================
ESCUCHAR CAMBIOS EN TIEMPO REAL
========================================= */

export function escucharSistema(
    callback
) {

    return onSnapshot(
        SISTEMA_REF,
        resultado => {

            if (
                !resultado.exists()
            ) {

                callback({

                    modo:
                        "online"

                });

                return;

            }


            callback(
                resultado.data()
            );

        }
    );

}
