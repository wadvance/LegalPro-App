import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// ============================================================
// CONFIGURA AQUI LA URL DE TU API (archivo api.php en Alwaysdata)
// Ejemplo: 'https://TU_USUARIO.alwaysdata.net/api.php'
// Tambien la puedes cambiar dentro de la app en el campo "URL de la API".
// ============================================================
const String kApiBaseUrl = 'https://TU_USUARIO.alwaysdata.net/api.php';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LegalPro App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.grey[50],
      ),
      home: const DatabaseScreen(),
    );
  }
}

class DatabaseScreen extends StatefulWidget {
  const DatabaseScreen({super.key});

  @override
  State<DatabaseScreen> createState() => _DatabaseScreenState();
}

class _DatabaseScreenState extends State<DatabaseScreen> {
  final TextEditingController _apiController =
      TextEditingController(text: kApiBaseUrl);

  String _estadoConexion = 'Desconectado';
  String _mensaje = 'Configura la URL de tu API de Alwaysdata para empezar.';
  List<Map<String, String>> _registros = [];
  bool _cargando = false;

  String get _apiUrl => _apiController.text.trim();

  @override
  void dispose() {
    _apiController.dispose();
    super.dispose();
  }

  Future<void> _probarConexion() async {
    if (_apiUrl.isEmpty || _apiUrl.contains('TU_USUARIO')) {
      setState(() {
        _estadoConexion = 'Falta configurar';
        _mensaje =
            'Pega la URL de tu api.php de Alwaysdata en el campo "URL de la API". Ver la carpeta abogados_app/api/README.md.';
      });
      return;
    }

    setState(() {
      _cargando = true;
      _estadoConexion = 'Conectando...';
      _mensaje = 'Contactando $_apiUrl...';
    });

    try {
      final uri = Uri.parse('$_apiUrl?action=list');
      final resp = await http.get(uri).timeout(const Duration(seconds: 15));
      if (resp.statusCode != 200) {
        throw Exception('HTTP ${resp.statusCode}');
      }
      final body = jsonDecode(resp.body) as Map<String, dynamic>;
      if (body['ok'] != true) {
        throw Exception(body['error'] ?? 'La API devolvio un error.');
      }
      final datos = (body['data'] as List?) ?? [];
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Conectado';
        _mensaje = 'Conexion exitosa con la API y MySQL en Alwaysdata.';
        _registros = datos.map((e) {
          final m = e as Map;
          return {
            'id': '${m['id'] ?? ''}',
            'nombre': '${m['nombre'] ?? 'Sin nombre'}',
            'valor': '${m['valor'] ?? ''}',
          };
        }).toList();
      });
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Sin respuesta';
        _mensaje =
            'La API tardo mas de 15 segundos. Revisa la URL y que api.php este subido en Alwaysdata.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Error de conexion';
        _mensaje = 'No se pudo conectar: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _cargando = false;
        });
      }
    }
  }

  Future<void> _insertarRegistro() async {
    if (_apiUrl.isEmpty || _apiUrl.contains('TU_USUARIO')) {
      setState(() {
        _estadoConexion = 'Falta configurar';
        _mensaje = 'Primero configura la URL de tu API.';
      });
      return;
    }

    setState(() {
      _cargando = true;
    });

    try {
      final uri = Uri.parse(_apiUrl);
      final resp = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'nombre': 'Registro desde Flutter',
              'valor': DateTime.now().toIso8601String(),
            }),
          )
          .timeout(const Duration(seconds: 15));
      if (resp.statusCode != 200) {
        throw Exception('HTTP ${resp.statusCode}');
      }
      final body = jsonDecode(resp.body) as Map<String, dynamic>;
      if (body['ok'] != true) {
        throw Exception(body['error'] ?? 'La API devolvio un error.');
      }
      await _probarConexion();
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Sin respuesta';
        _mensaje = 'La API tardo mas de 15 segundos al insertar.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Error al insertar';
        _mensaje = 'No se pudo insertar: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _cargando = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conexion MySQL'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTarjetaApi(),
            const SizedBox(height: 24),
            _buildTarjetaEstado(),
            const SizedBox(height: 24),
            _buildBotonesAccion(),
            const SizedBox(height: 24),
            _buildResultados(),
          ],
        ),
      ),
    );
  }

  Widget _buildTarjetaApi() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'URL de la API (Alwaysdata)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _apiController,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                hintText: 'https://TU_USUARIO.alwaysdata.net/api.php',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTarjetaEstado() {
    final conectado = _estadoConexion == 'Conectado';
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Estado de Conexion',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: conectado ? Colors.green : Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(_estadoConexion)),
              ],
            ),
            const SizedBox(height: 8),
            Text(_mensaje),
          ],
        ),
      ),
    );
  }

  Widget _buildBotonesAccion() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton(
                onPressed: _cargando ? null : _probarConexion,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: _cargando
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation(Colors.white),
                        ),
                      )
                    : const Text('Probar Conexion'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _cargando ? null : _insertarRegistro,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Insertar Registro'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultados() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Resultados de la Consulta',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            if (_cargando)
              const Padding(
                padding: EdgeInsets.all(8.0),
                child: CircularProgressIndicator(),
              )
            else if (_registros.isEmpty)
              const Text(
                'No hay datos. Configura tu API y usa "Insertar Registro".',
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _registros.length,
                itemBuilder: (context, index) {
                  final registro = _registros[index];
                  return ListTile(
                    title: Text(
                      registro['nombre'] ?? 'Sin nombre',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      'ID: ${registro['id']} | Valor: ${registro['valor']}',
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
