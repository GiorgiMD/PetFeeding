# PetFeeding

## Instrucciones de ejecución

### 1. Requisitos

- **Node.js 18 o superior** y **npm**. Express 5 requiere esta versión mínima y la conexión con el dispensador utiliza `fetch` de Node.js.
- **MySQL 8.0**, con el servicio iniciado. El respaldo incluido utiliza la intercalación `utf8mb4_0900_ai_ci`.
- Un navegador con JavaScript habilitado.
- Para dispensar alimento físicamente: una **ESP32** con el firmware configurado y accesible desde la computadora donde se ejecuta Node.js. El registro de usuarios, la gestión de perros y el cálculo de alimento pueden utilizarse sin el dispositivo.

Ejecuta los comandos desde la raíz del proyecto, donde se encuentra `package.json`.

### 2. Instalar las dependencias

```bash
npm install
```

En Windows, si PowerShell bloquea `npm.ps1`, utiliza `npm.cmd` en lugar de `npm` en los comandos de esta guía.

### 3. Crear e importar la base de datos

Abre el cliente de MySQL desde la raíz del proyecto:

```bash
mysql -u root -p
```

Introduce tu contraseña y ejecuta lo siguiente **dentro del cliente de MySQL**:

```sql
CREATE DATABASE petfeeding CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE petfeeding;
SOURCE models/SQL/petfeeding.dump;
EXIT;
```

El archivo [petfeeding.dump](models/SQL/petfeeding.dump) crea las tablas `usuarios`, `perros`, `razas`, `croquetas`, `enfermedades` y `actividades`. También carga los catálogos necesarios para llenar los formularios; las tablas de usuarios y perros se importan vacías.

**Importa el respaldo en una base nueva:** contiene instrucciones `DROP TABLE` que reemplazan las tablas existentes. Los archivos `.sql` individuales de los catálogos no son necesarios si ya importaste el respaldo completo.

Si `mysql` no se reconoce como comando, abre su ejecutable desde la carpeta de instalación o utiliza un gestor como MySQL Workbench para crear la base e importar el mismo archivo.

### 4. Configurar las variables de entorno

Crea un archivo `.env` en la raíz, o ajusta el existente con tus valores:

```dotenv
DB_NAME=petfeeding
DB_USER=root
DB_PASSWORD=tu_contrasena_de_mysql
DB_HOST=127.0.0.1
DB_PORT=3306
SECRET=reemplaza_este_valor_por_un_secreto_aleatorio
PORT=4000
IP_ESP32=http://192.168.1.100
```

| Variable | Función |
| --- | --- |
| `DB_NAME` | Nombre de la base importada. |
| `DB_USER` | Usuario de MySQL con acceso a esa base. |
| `DB_PASSWORD` | Contraseña del usuario de MySQL. |
| `DB_HOST` | Dirección del servidor de MySQL. |
| `DB_PORT` | Puerto del servidor de MySQL. |
| `SECRET` | Secreto utilizado para firmar la cookie de sesión. |
| `PORT` | Puerto de la aplicación; si se omite, se utiliza `4000`. |
| `IP_ESP32` | URL base del dispensador, con `http://` y sin barra final. La dirección del ejemplo debe sustituirse por la del dispositivo. |

Puedes generar un valor para `SECRET` con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

La configuración se carga mediante `dotenv` en [models/db.js](models/db.js). `.env` está excluido de Git.

### 5. Iniciar el servidor

Para trabajar con reinicio automático al modificar el código:

```bash
npm run petfeeding
```

Para ejecutarlo sin reinicio automático:

```bash
npm start
```

Con la configuración correcta, la terminal muestra los mensajes `Base de datos conectada` y `Servidor funcionando en el puerto 4000`.

Abre **http://localhost:4000/**. Si modificaste `PORT`, utiliza ese puerto. Para detener el servidor, presiona `Ctrl + C` en la terminal.

La base de datos debe estar disponible antes de iniciar: el proyecto consulta los catálogos al cargar los controladores y no crea las tablas automáticamente.

### 6. Primer uso

1. Entra en **Registro** y crea una cuenta.
2. Inicia sesión con tu correo y contraseña.
3. Selecciona **+ Agregar Perrito** y completa sus datos.
4. Abre **Mis Perritos** para consultar la cantidad de alimento, editar o eliminar registros.
5. Utiliza **Alimentar** cuando hayas configurado la ESP32 según la sección de integración de este documento.

## Cómo funciona cada pantalla

### Inicio — `/`

**Vista:** [views/inicio.pug](views/inicio.pug).

Presenta PetFeeding y sus secciones informativas: beneficios, plataforma web, hardware, galería y proyecto. Sin sesión, muestra un botón para registrarse. Con sesión, muestra un saludo con el nombre del usuario y el botón **Ir a mi panel**, que abre **Mis Perritos**.

El menú compartido cambia según la sesión:

- **Sin sesión:** Inicio, Registro e Iniciar Sesión.
- **Con sesión:** Inicio, + Agregar Perrito, Mis Perritos y Cerrar Sesión.

Los textos de presentación mencionan horarios, historial y monitoreo de la tolva, pero la versión actual no implementa pantallas ni procesos para esas funciones. Las funciones disponibles son registro, gestión de perros, cálculo de alimento y envío manual de una orden al dispensador.

### Registro de usuario — `/usuario`

**Vista:** [views/usuario.pug](views/usuario.pug).

Solicita **nombre, correo electrónico y contraseña**. El icono del ojo permite mostrar u ocultar la contraseña.

Al presionar **Registrar**, el servidor comprueba que los campos estén completos, que el correo tenga un formato válido y que no exista otra cuenta con el mismo correo. La contraseña debe tener al menos **8 caracteres**, **una mayúscula** y **un carácter especial admitido**, por ejemplo `!` o `@`.

La contraseña se guarda como un hash generado con `bcryptjs`. Si el registro termina correctamente, se muestra una confirmación y se dirige al usuario al inicio de sesión. Los errores de validación se muestran en el formulario.

### Inicio de sesión — `/login`

**Vista:** [views/login.pug](views/login.pug).

Solicita el correo y la contraseña de una cuenta registrada. También permite mostrar u ocultar la contraseña.

Al presionar **Iniciar sesión**, busca al usuario por correo y compara la contraseña con el hash almacenado. Si coincide, guarda el identificador, nombre y correo del usuario en la sesión y abre **Inicio**. Si el correo no está registrado, muestra una alerta que dirige al registro; si la contraseña es incorrecta, muestra el error en el formulario.

### Agregar Perrito — `/nuevo_perro`

**Vista:** [views/nuevo_perro.pug](views/nuevo_perro.pug).

Requiere iniciar sesión. El formulario reúne los datos utilizados para registrar al perro y calcular su alimento:

| Campo | Uso y validación |
| --- | --- |
| Nombre | Obligatorio; admite letras y espacios. |
| Foto | Opcional. El servidor admite JPG/JPEG o PNG de hasta 2 MB. |
| Raza | Se selecciona del catálogo de la base de datos. |
| Croquetas | Se elige la marca y el tipo de producto del catálogo. Su energía en kcal/kg interviene en el cálculo. |
| Edad | Se introduce en años, de 0 a 25, y meses, de 0 a 11. Debe completarse al menos uno de los dos campos. |
| Peso | Se introduce en kilogramos, entre 0.5 y 100. |
| Esterilización | Debe seleccionarse Sí o No. |
| Enfermedades | Al elegir Sí, aparecen opciones agrupadas en Control de peso, Digestiva y Alergias y piel; debe seleccionarse al menos una. |
| Actividad física | Al elegir Sí, aparecen las actividades del catálogo; debe seleccionarse al menos una. |

Al cambiar enfermedades o actividad física a **No**, se ocultan y desmarcan sus opciones.

**Registrar a mi perro** valida los datos, convierte la edad a meses, calcula los gramos de alimento y guarda el registro asociado al usuario de la sesión. La foto se almacena en `uploads/perros/`, carpeta que se crea automáticamente. Después se muestra una alerta para volver a **Mis Perritos**.

Aunque el selector de archivos también muestra WebP, el servidor solo acepta JPG/JPEG y PNG. Actualmente no hay una imagen de reemplazo para los perros registrados sin foto.

### Mis Perritos — `/mis_perros`

**Vista:** [views/mis_perros.pug](views/mis_perros.pug).

Requiere iniciar sesión y consulta los perros asociados al usuario actual. Si no hay registros, muestra una invitación para agregar el primero.

Cada tarjeta presenta la foto, nombre, raza, edad en meses, peso y estado de esterilización. En el apartado de alimento aparecen la imagen de las croquetas, su marca, tipo, energía en kcal/kg y cantidad sugerida en gramos.

Las acciones disponibles son:

- **Alimentar:** consulta la cantidad guardada en la base de datos y envía desde Node.js una petición a `IP_ESP32/servo/abrir?gramos=<cantidad>`. Si el dispositivo no responde correctamente, se devuelve un error en formato JSON.
- **Editar:** abre el formulario del perro con sus datos actuales.
- **Eliminar:** muestra una confirmación. **Aceptar** elimina el registro y vuelve al listado; **Cancelar** regresa sin eliminarlo.

**Comportamiento actual del alimento:** aunque el campo de cantidad permite escribir, ese cambio no se envía ni se guarda. **Alimentar** utiliza siempre `perro.alimento` de la base de datos, sin dividirlo en comidas.

Después de una respuesta correcta de la ESP32, el controlador vuelve a mostrar esta vista sin consultar la lista de perros; por eso puede aparecer el mensaje de lista vacía. Vuelve a entrar en **Mis Perritos** para cargarla. El código contempla el texto **Detener**, pero esa acción todavía no está conectada con la ruta `/detener` del dispositivo.

### Editar Perrito — `/editar/:id`

**Vista reutilizada:** [views/nuevo_perro.pug](views/nuevo_perro.pug). `:id` representa el identificador del perro.

Se accede mediante **Editar** en una tarjeta. Carga los datos registrados y cambia el botón principal a **Guardar Cambios**. El encabezado visual sigue mostrando el formulario de registro.

Al guardar, vuelve a validar los datos, recalcula el alimento y actualiza el registro. Si se selecciona una nueva foto, se utiliza ese archivo; si no se selecciona otra, se conserva la foto anterior. Una alerta confirma la operación y permite volver al listado.

En la implementación actual, la edad se precarga dividiendo los meses entre 12 sin separar correctamente el resto. Si aparecen años decimales y cero meses, revisa los dos campos antes de guardar.

### Cerrar sesión — confirmación

Se accede desde **Cerrar Sesión** en el menú. No tiene una plantilla independiente: muestra una alerta sobre la vista actual mediante `/logout?vista=<vista>`.

**Aceptar** llama a `/confirmLogOut`, destruye la sesión, elimina su cookie y regresa al inicio. **Cancelar** vuelve a la pantalla anterior.

## Cómo se calcula el alimento

El cálculo está en `calcularAlimento`, dentro de [controllers/nuevo_perroController.js](controllers/nuevo_perroController.js). Se ejecuta al registrar o editar un perro:

```text
Edad en meses = años × 12 + meses
RER = 70 × peso_en_kg^0.75
MER = RER × factor
Gramos diarios sugeridos = redondear(MER / (kcal_por_kg_de_croquetas / 1000))
```

El factor se selecciona según edad, obesidad o sobrepeso, actividad física y esterilización. Las otras enfermedades seleccionadas se almacenan, pero no modifican el factor. El resultado se guarda en el campo `alimento` del perro y se muestra en su tarjeta.

El cálculo intenta usar un umbral de adultez de 16 meses para razas grandes o gigantes y de 12 meses para las demás. Sin embargo, el modelo [models/Razas.js](models/Razas.js) no declara el campo `tamano` que existe en la base; con ese modelo, el cálculo utiliza el umbral de 12 meses.

## Integración con el dispensador ESP32

El archivo [PetFeeding.cpp](PetFeeding.cpp) contiene el código del dispositivo. Utiliza WiFi, un servidor HTTP en el puerto 80, un servo, una báscula con HX711 y una pantalla OLED SSD1306 de 128 × 64.

Para preparar el dispositivo se necesita un entorno Arduino para ESP32 con las bibliotecas `HX711`, `ESP32Servo`, `Adafruit_GFX` y `Adafruit_SSD1306`, además de `WiFi`, `WebServer` y `Wire` del entorno de la placa. El firmware se carga por separado; `npm start` solo inicia la aplicación web.

**Estado del archivo incluido:** `setup()` utiliza `redCreada` sin declararla y mezcla la configuración de estación WiFi con mensajes de punto de acceso. Es necesario completar esa configuración antes de compilar y cargar el firmware. El archivo no debe considerarse listo para cargar tal como está.

Una vez configurado el dispositivo:

1. Conecta la ESP32 a una red accesible desde el servidor Node.js.
2. Coloca su URL en `IP_ESP32` y reinicia la aplicación.
3. Comprueba la comunicación consultando `/servo/status` o `/bascula/peso` en esa URL.
4. Ajusta `factorCalibracion` para la báscula instalada antes de utilizar cantidades de alimento.

| Conexión | GPIO configurado |
| --- | --- |
| Señal del servo | 23 |
| HX711 DT | 27 |
| HX711 SCK | 26 |
| OLED SDA | 33 |
| OLED SCL | 32 |

El firmware recibe los gramos solicitados, calcula `pesoMeta = pesoInicial + gramosObjetivo` y abre el servo. Durante el ciclo de lectura, lo cierra cuando el peso alcanza la meta menos la tolerancia configurada de 2 gramos. La respuesta HTTP confirma el inicio de la orden; la web no espera ni verifica su finalización.

### Pantallas del dispositivo

- **Página web de la ESP32 — `/`:** muestra «ESP32 ACTIVA» y las rutas disponibles. Es una página de diagnóstico independiente de la aplicación Node.js.
- **Pantalla OLED:** muestra una presentación al arrancar y después el peso actual en gramos. El código actualiza el peso aproximadamente cada 250 ms y la pantalla cada 500 ms.

| Ruta de la ESP32 | Función |
| --- | --- |
| `/servo/abrir?gramos=<cantidad>` | Inicia la dispensación de la cantidad indicada. |
| `/servo/status` | Consulta posición del servo y estado de dispensación. |
| `/bascula/peso` | Consulta peso, objetivo y estado del sistema. |
| `/bascula/tara` | Realiza la tara cuando no se está dispensando. |
| `/detener` | Detiene la dispensación y cierra el servo. |
| `/servo/probar/abrir` | Abre el servo en modo de prueba. |
| `/servo/probar/cerrar` | Cierra el servo en modo de prueba. |

## Estructura del proyecto

| Ruta | Responsabilidad |
| --- | --- |
| [index.js](index.js) | Inicia Express, configura Pug, archivos estáticos, sesiones y rutas. |
| [routes/routes.js](routes/routes.js) | Define las rutas de navegación y las operaciones del servidor. |
| `controllers/` | Gestiona usuarios, sesiones, perros, cálculo de alimento y comunicación con la ESP32. |
| `models/` | Contiene la conexión a MySQL y los modelos Sequelize. |
| `models/SQL/` | Incluye el respaldo de la base y los catálogos SQL. |
| `views/` | Contiene las cinco vistas Pug, sus componentes y los diseños compartidos. |
| `public/` | Contiene estilos, JavaScript del navegador, logotipo e imágenes de croquetas. |
| [middleware/uploadImagen.js](middleware/uploadImagen.js) | Valida y almacena las fotos mediante Multer. |
| `uploads/perros/` | Almacena las fotos cargadas; está excluida de Git. |
| [PetFeeding.cpp](PetFeeding.cpp) | Contiene el firmware del dispensador. |

La aplicación combina **Express**, **Pug**, **Sequelize/MySQL**, **express-session**, **bcryptjs**, **Multer**, **Bootstrap** y **SweetAlert2**. Las sesiones se almacenan en memoria con la configuración actual, por lo que es necesario iniciar sesión de nuevo después de reiniciar Node.js.

## Problemas frecuentes

| Situación | Qué revisar |
| --- | --- |
| El servidor no inicia o falla al consultar catálogos | Que MySQL esté activo, que los valores `DB_*` sean correctos y que se haya importado el respaldo antes de iniciar Node.js. |
| El puerto está ocupado (`EADDRINUSE`) | Cambia `PORT` en `.env`, reinicia y abre la nueva dirección. |
| La foto es rechazada | Utiliza JPG/JPEG o PNG de hasta 2 MB. |
| Falla el botón Alimentar | Comprueba `IP_ESP32`, la conexión desde el servidor, la disponibilidad del HX711 y que no haya otra dispensación en curso. |
| Se pierde la sesión al reiniciar el servidor | Es el comportamiento del almacenamiento de sesiones en memoria utilizado por el proyecto. |
| Faltan fuentes o imágenes decorativas del inicio | Algunas se descargan desde Google Fonts, Unsplash e Icons8 y requieren conexión a Internet. |
| Aparece `ERR_MODULE_NOT_FOUND` en un sistema sensible a mayúsculas | Varios modelos importan `Sequelize` con mayúscula, aunque el paquete se llama `sequelize`; también se importa `models/enfermedades.js`, pero el archivo se llama `Enfermedades.js`. Esos nombres deben coincidir para ejecutar el proyecto en ese entorno. |
