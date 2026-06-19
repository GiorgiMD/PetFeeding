#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <HX711.h>
#include <ESP32Servo.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const char* ssidAP = "DispensadorESP32";
const char* passwordAP = "12345678";

WebServer server(80);

#define ANCHO_PANTALLA 128
#define ALTO_PANTALLA 64

Adafruit_SSD1306 display(ANCHO_PANTALLA, ALTO_PANTALLA, &Wire, -1);

const int pinSDA = 33;
const int pinSCL = 32;

bool pantallaDisponible = false;

Servo servo;

const int pinServo = 23;

const int POS_CERRADO = 0;
const int POS_ABIERTO = 90;

bool estaAbierto = false;
int posicionActual = POS_CERRADO;

const int pinDT = 27;
const int pinSCK = 26;

HX711 bascula;

bool basculaDisponible = false;

float factorCalibracion = 205.0;

float pesoActual = 0.0;
float pesoInicial = 0.0;
float gramosObjetivo = 0.0;
float pesoMeta = 0.0;

bool dispensando = false;

float tolerancia = 2.0;

unsigned long ultimoPeso = 0;
unsigned long ultimaPantalla = 0;

String estadoSistema = "LISTO";

void agregarCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void textoCentrado(String texto, int textSize, int y) {
  if (!pantallaDisponible) {
    return;
  }

  int16_t x1, y1;
  uint16_t w, h;

  display.setTextSize(textSize);
  display.getTextBounds(texto, 0, 0, &x1, &y1, &w, &h);

  int x = (ANCHO_PANTALLA - w) / 2;

  display.setCursor(x, y);
  display.print(texto);
}

void mostrarPresentacion() {
  if (!pantallaDisponible) {
    return;
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  textoCentrado("GIORGI", 2, 16);
  textoCentrado("SW", 2, 40);

  display.display();
  delay(1800);
}

void mostrarGramos() {
  if (!pantallaDisponible) {
    return;
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  String texto = String(pesoActual, 1) + " G";

  if (texto.length() <= 6) {
    textoCentrado(texto, 3, 22);
  } else {
    textoCentrado(texto, 2, 25);
  }

  display.display();
}

float leerPeso() {
  if (!basculaDisponible) {
    return 0.0;
  }

  if (bascula.is_ready()) {
    float peso = bascula.get_units(5);

    if (peso > -0.5 && peso < 0.5) {
      peso = 0.0;
    }

    return peso;
  }

  return pesoActual;
}

void moverServo(int posicion) {
  servo.write(posicion);

  posicionActual = posicion;

  if (posicion == POS_ABIERTO) {
    estaAbierto = true;
  } else {
    estaAbierto = false;
  }
}

void paginaPrincipal() {
  agregarCors();

  String html = "";
  html += "<!DOCTYPE html>";
  html += "<html>";
  html += "<head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>ESP32 Dispensador</title>";
  html += "<style>";
  html += "body{font-family:Arial;background:#111;color:white;text-align:center;padding:30px;}";
  html += "h1{color:#00ff88;}";
  html += "code{background:#222;padding:6px 10px;border-radius:6px;display:inline-block;margin:5px;}";
  html += "</style>";
  html += "</head>";
  html += "<body>";
  html += "<h1>ESP32 ACTIVA</h1>";
  html += "<p>Servidor funcionando.</p>";
  html += "<p>Rutas disponibles:</p>";
  html += "<code>/servo/abrir?gramos=50</code><br>";
  html += "<code>/bascula/peso</code><br>";
  html += "<code>/bascula/tara</code><br>";
  html += "<code>/servo/status</code><br>";
  html += "<code>/servo/probar/abrir</code><br>";
  html += "<code>/servo/probar/cerrar</code><br>";
  html += "<code>/detener</code>";
  html += "</body>";
  html += "</html>";

  server.send(200, "text/html", html);
}

void abrirServoConPeso() {
  agregarCors();

  if (!basculaDisponible) {
    server.send(503, "application/json",
      "{\"ok\":false,\"error\":\"HX711 no detectado\"}"
    );
    return;
  }

  if (!server.hasArg("gramos")) {
    server.send(400, "application/json",
      "{\"ok\":false,\"error\":\"Falta el parametro gramos\"}"
    );
    return;
  }

  if (dispensando) {
    server.send(409, "application/json",
      "{\"ok\":false,\"error\":\"Ya se esta dispensando\"}"
    );
    return;
  }

  gramosObjetivo = server.arg("gramos").toFloat();

  if (gramosObjetivo <= 0) {
    server.send(400, "application/json",
      "{\"ok\":false,\"error\":\"Gramos invalidos\"}"
    );
    return;
  }

  pesoActual = leerPeso();
  pesoInicial = pesoActual;
  pesoMeta = pesoInicial + gramosObjetivo;

  dispensando = true;
  estadoSistema = "DISPENSANDO";

  moverServo(POS_ABIERTO);

  String json = "{";
  json += "\"ok\":true,";
  json += "\"mensaje\":\"Servo abierto. Cerrara automatico al llegar al peso.\",";
  json += "\"pesoInicial\":" + String(pesoInicial, 2) + ",";
  json += "\"gramosObjetivo\":" + String(gramosObjetivo, 2) + ",";
  json += "\"pesoMeta\":" + String(pesoMeta, 2) + ",";
  json += "\"pesoActual\":" + String(pesoActual, 2) + ",";
  json += "\"servo\":\"abierto\"";
  json += "}";

  server.send(200, "application/json", json);
}

void estadoBascula() {
  agregarCors();

  pesoActual = leerPeso();

  String json = "{";
  json += "\"ok\":true,";
  json += "\"hx711Detectado\":";
  json += (basculaDisponible ? "true" : "false");
  json += ",";
  json += "\"pesoActual\":" + String(pesoActual, 2) + ",";
  json += "\"pesoInicial\":" + String(pesoInicial, 2) + ",";
  json += "\"gramosObjetivo\":" + String(gramosObjetivo, 2) + ",";
  json += "\"pesoMeta\":" + String(pesoMeta, 2) + ",";
  json += "\"dispensando\":";
  json += (dispensando ? "true" : "false");
  json += ",";
  json += "\"estadoSistema\":\"" + estadoSistema + "\",";
  json += "\"servo\":\"";
  json += (estaAbierto ? "abierto" : "cerrado");
  json += "\"";
  json += "}";

  server.send(200, "application/json", json);
}

void hacerTara() {
  agregarCors();

  if (!basculaDisponible) {
    server.send(503, "application/json",
      "{\"ok\":false,\"error\":\"HX711 no detectado\"}"
    );
    return;
  }

  if (dispensando) {
    server.send(409, "application/json",
      "{\"ok\":false,\"error\":\"No se puede hacer tara mientras dispensa\"}"
    );
    return;
  }

  if (!bascula.is_ready()) {
    server.send(503, "application/json",
      "{\"ok\":false,\"error\":\"HX711 no esta listo\"}"
    );
    return;
  }

  estadoSistema = "TARA";

  bascula.tare(20);

  pesoActual = 0.0;
  pesoInicial = 0.0;
  gramosObjetivo = 0.0;
  pesoMeta = 0.0;

  estadoSistema = "LISTO";
  mostrarGramos();

  server.send(200, "application/json",
    "{\"ok\":true,\"mensaje\":\"Tara realizada\"}"
  );
}

void detenerEmergencia() {
  agregarCors();

  dispensando = false;
  gramosObjetivo = 0.0;
  pesoMeta = 0.0;
  estadoSistema = "DETENIDO";

  moverServo(POS_CERRADO);

  server.send(200, "application/json",
    "{\"ok\":true,\"mensaje\":\"Detenido manualmente\"}"
  );
}

void estadoServo() {
  agregarCors();

  String json = "{";
  json += "\"ok\":true,";
  json += "\"estado\":\"";
  json += (estaAbierto ? "abierto" : "cerrado");
  json += "\",";
  json += "\"posicion\":" + String(posicionActual) + ",";
  json += "\"dispensando\":";
  json += (dispensando ? "true" : "false");
  json += "}";

  server.send(200, "application/json", json);
}

void probarServoAbrir() {
  agregarCors();

  dispensando = false;
  estadoSistema = "PRUEBA";
  moverServo(POS_ABIERTO);

  server.send(200, "application/json",
    "{\"ok\":true,\"mensaje\":\"Servo abierto en prueba\"}"
  );
}

void probarServoCerrar() {
  agregarCors();

  dispensando = false;
  estadoSistema = "PRUEBA";
  moverServo(POS_CERRADO);

  server.send(200, "application/json",
    "{\"ok\":true,\"mensaje\":\"Servo cerrado en prueba\"}"
  );
}

void manejarOptions() {
  agregarCors();
  server.send(204);
}

void configurarRutas() {
  server.on("/", HTTP_GET, paginaPrincipal);

  server.on("/servo/abrir", HTTP_GET, abrirServoConPeso);
  server.on("/servo/status", HTTP_GET, estadoServo);
  server.on("/servo/probar/abrir", HTTP_GET, probarServoAbrir);
  server.on("/servo/probar/cerrar", HTTP_GET, probarServoCerrar);

  server.on("/bascula/peso", HTTP_GET, estadoBascula);
  server.on("/bascula/tara", HTTP_GET, hacerTara);

  server.on("/detener", HTTP_GET, detenerEmergencia);

  server.on("/servo/abrir", HTTP_OPTIONS, manejarOptions);
  server.on("/servo/status", HTTP_OPTIONS, manejarOptions);
  server.on("/servo/probar/abrir", HTTP_OPTIONS, manejarOptions);
  server.on("/servo/probar/cerrar", HTTP_OPTIONS, manejarOptions);
  server.on("/bascula/peso", HTTP_OPTIONS, manejarOptions);
  server.on("/bascula/tara", HTTP_OPTIONS, manejarOptions);
  server.on("/detener", HTTP_OPTIONS, manejarOptions);

  server.onNotFound([]() {
    agregarCors();

    if (server.method() == HTTP_OPTIONS) {
      server.send(204);
      return;
    }

    server.send(404, "application/json",
      "{\"ok\":false,\"error\":\"Ruta no encontrada\"}"
    );
  });
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("INICIANDO ESP32");

  WiFi.mode(WIFI_STA);
  WiFi.begin();

  if (redCreada) {
    Serial.println("RED WIFI CREADA");
  } else {
    Serial.println("ERROR AL CREAR RED WIFI");
  }

  Serial.print("NOMBRE: ");
  Serial.println(ssidAP);

  Serial.print("IP: ");
  Serial.println(WiFi.softAPIP());

  configurarRutas();
  server.begin();

  Serial.println("SERVIDOR HTTP INICIADO");

  Wire.begin(pinSDA, pinSCL);

  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    pantallaDisponible = true;
    mostrarPresentacion();
  } else {
    pantallaDisponible = false;
  }

  servo.setPeriodHertz(50);
  servo.attach(pinServo, 500, 2400);
  moverServo(POS_CERRADO);

  bascula.begin(pinDT, pinSCK);
  bascula.set_scale(factorCalibracion);

  delay(1000);

  if (bascula.is_ready()) {
    basculaDisponible = true;
    bascula.tare(20);

    pesoActual = 0.0;
    pesoInicial = 0.0;
    gramosObjetivo = 0.0;
    pesoMeta = 0.0;

    estadoSistema = "LISTO";
  } else {
    basculaDisponible = false;
    estadoSistema = "HX711 ERROR";
  }

  mostrarGramos();
}

void loop() {
  server.handleClient();

  if (millis() - ultimoPeso >= 250) {
    ultimoPeso = millis();

    if (basculaDisponible) {
      pesoActual = leerPeso();
    } else {
      pesoActual = 0.0;
    }
  }

  if (millis() - ultimaPantalla >= 500) {
    ultimaPantalla = millis();
    mostrarGramos();
  }

  if (dispensando && basculaDisponible) {
    if (pesoActual >= pesoMeta - tolerancia) {
      dispensando = false;
      estadoSistema = "COMPLETADO";
      moverServo(POS_CERRADO);
    }
  }
}
