import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'firebase_options.dart';

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
  String _estadoConexion = 'Iniciando...';
  String _mensaje = 'Conectando con Firebase...';
  List<Map<String, String>> _registros = [];
  bool _cargando = false;
  bool _firebaseListo = false;

  static const Duration _timeout = Duration(seconds: 15);

  @override
  void initState() {
    super.initState();
    _iniciarFirebase();
  }

  Future<void> _iniciarFirebase() async {
    setState(() {
      _cargando = true;
      _estadoConexion = 'Conectando...';
      _mensaje = 'Conectando con Firebase (bufete-abogados)...';
    });
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      ).timeout(_timeout);
      await FirebaseAuth.instance.signInAnonymously().timeout(_timeout);
      if (!mounted) return;
      setState(() {
        _firebaseListo = true;
      });
      await _probarConexion();
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Sin respuesta';
        _mensaje =
            'Firebase tardo mas de 15 segundos. Revisa tu conexion a internet.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Error de conexion';
        _mensaje = 'No se pudo iniciar Firebase: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _cargando = false;
        });
      }
    }
  }

  CollectionReference<Map<String, dynamic>> get _coleccion =>
      FirebaseFirestore.instance.collection('registros');

  Future<void> _probarConexion() async {
    if (!_firebaseListo) {
      await _iniciarFirebase();
      return;
    }
    setState(() {
      _cargando = true;
      _estadoConexion = 'Conectando...';
      _mensaje = 'Leyendo coleccion "registros" en Firestore...';
    });
    try {
      final snap =
          await _coleccion.orderBy('creado', descending: true).limit(20).get().timeout(_timeout);
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Conectado';
        _mensaje = 'Conexion exitosa con Firestore (bufete-abogados).';
        _registros = snap.docs.map((d) {
          final data = d.data();
          return {
            'id': d.id,
            'nombre': '${data['nombre'] ?? 'Sin nombre'}',
            'valor': '${data['valor'] ?? ''}',
          };
        }).toList();
      });
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Sin respuesta';
        _mensaje = 'Firestore tardo mas de 15 segundos en responder.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Error de conexion';
        _mensaje = 'No se pudo leer Firestore: $e';
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
    if (!_firebaseListo) {
      setState(() {
        _mensaje = 'Espera a que Firebase se conecte primero.';
      });
      return;
    }
    setState(() {
      _cargando = true;
    });
    try {
      await _coleccion.add({
        'nombre': 'Registro desde Flutter',
        'valor': DateTime.now().toIso8601String(),
        'creado': FieldValue.serverTimestamp(),
      }).timeout(_timeout);
      await _probarConexion();
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _estadoConexion = 'Sin respuesta';
        _mensaje = 'Firestore tardo mas de 15 segundos al insertar.';
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
        title: const Text('Conexion Firebase'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTarjetaInfo(),
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

  Widget _buildTarjetaInfo() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Base de datos',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            SizedBox(height: 8),
            Text('Proveedor: Firebase (Cloud Firestore)'),
            Text('Proyecto: bufete-abogados'),
            Text('Coleccion: registros'),
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
                'No hay datos. Usa "Insertar Registro" para crear el primero.',
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
