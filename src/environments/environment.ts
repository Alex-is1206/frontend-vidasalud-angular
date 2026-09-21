/**
 * Configuración del frontend VidaSalud.
 *
 * Todo lo que depende del entorno (tenant, aplicación registrada,
 * URL del backend) vive aquí y no repartido por los componentes.
 * Al desplegar, solo cambian estos valores.
 */
const API_ID_URI = 'api://2b3609f5-dacf-4b1b-b9ec-fa0dfd1be88d';

export const environment = {
  production: false,

  msal: {
    // Aplicación vidasalud-spa en el tenant Prueba1
    clientId: '1afc31d5-2670-4e0d-b23a-e45a9417cf58',
    authority:
      'https://login.microsoftonline.com/596d0d2f-cf4a-4fd1-8c07-98226aeaeaa5',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin
  },

  api: {
    baseUrl: 'https://cw4eu8c1fi.execute-api.us-east-1.amazonaws.com',

    // Los 4 scopes que expone vidasalud-api
    scopes: [
      `${API_ID_URI}/Appointments.Read`,
      `${API_ID_URI}/Appointments.Write`,
      `${API_ID_URI}/Catalog.Read`,
      `${API_ID_URI}/Catalog.Write`
    ]
  }
};
