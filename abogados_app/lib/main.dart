import 'package:flutter/material.dart';
import 'package:mysql1/mysql1.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App Moderno',
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
late String _estadoConexion = 'Desconectado';
  late List<Map<String, dynamic>> _registros = [];
  bool _cargando = false;

  final String _host = 'mysql.alwaysdata.net';
  final String _baseDatos = 'tu_base_de_datos';
  final String _usuario = 'tu_usuario';
  final String _password = 'tu_contraseña';

  @override
  void initState() {
    super.initState();
    _probarConexion();
  }

  Future<void> _probarConexion() async {
    setState(() {
      _cargando = true;
      _estadoConexion = 'Conectando...';
    });

    try {
      final conn = await MySqlConnection.connect(
        ConnectionSettings(
          host: _host,
          user: _usuario,
          password: _password,
          db: _baseDatos,
        ),
      );

      setState(() {
        _estadoConexion = 'Conectado';
      });

      await _cargarRegistros(conn);
      await conn.query('SELECT 1');
      conn.close();
    } finally {
      setState(() {
        _cargando = false;
      });
    }
  }

  Future<void> _cargarRegistros(MySqlConnection conn) async {
    try {
      final resultado = await conn.query('SELECT * FROM tus_tabla LIMIT 10');
      setState(() {
        _registros = resultado.fields.isNotEmpty
            ? List.generate(resultado.length, (index) {
                final map = <String, dynamic>{};
                for (int i = 0; i < resultado.fields.length; i++) {
                  final nombre = resultado.fields[i].name.toString();
                  final valor = resultado.elementAt(index)[i].toString();
                  map[nombre] = valor.isEmpty ? '' : valor;
                }
                return map;
              })
            : [];
      });
    } catch (e) {
      setState(() {
        _estadoConexion = 'Error al cargar datos: $e';
      });
    }
  }

  Future<void> _insertarRegistro() async {
    final conn = await MySqlConnection.connect(
      ConnectionSettings(
        host: _host,
        user: _usuario,
        password: _password,
        db: _baseDatos,
      ),
    );

    try {
      await conn.query(
        'INSERT INTO tus_tabla (nombre, valor) VALUES (?, ?)',
        ['Registro desde Flutter', DateTime.now().toIso8601String()],
      );
      await _probarConexion();
    } catch (e) {
      setState(() {
        _estadoConexion = 'Error al insertar: $e';
      });
    } finally {
      await conn.close();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conexión MySQL'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTarjetaEstado(),
            const SizedBox(height: 24),
            _buildTarjetaInfo(),
            const SizedBox(height: 24),
            _buildBotonesAccion(),
            const SizedBox(height: 24),
            _buildResultados(),
          ],
        ),
      ),
    );
  }

  Widget _buildTarjetaEstado() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Estado de Conexión',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _estadoConexion == 'Conectado' ? Colors.green : Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(_estadoConexion),
              ],
            ),
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
          children: [
            const Text(
              'Información de la Base de Datos',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            _buildFilaInfo('Host', _host),
            _buildFilaInfo('Base de Datos', _baseDatos),
            _buildFilaInfo('Usuario', _usuario),
            _buildFilaInfo('Estado', _estadoConexion),
          ],
        ),
      ),
    );
  }

  Widget _buildFilaInfo(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Text(
            '$etiqueta: ',
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          ),
          Text(
            valor,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
          ),
        ],
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
                    : const Text('Probar Conexión'),
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
            _cargando
                ? const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: CircularProgressIndicator(),
                  )
                : _registros.isEmpty
                    ? const Text(
                        'No hay datos. Usa "Insertar Registro" o consulta tu base.',
                      )
                    : ListView.builder(
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