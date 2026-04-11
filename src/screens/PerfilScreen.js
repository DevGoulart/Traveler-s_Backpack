    import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

    export default function PerfilScreen({ navigation }) {
    const botoes = [
        { nome: 'Biometria', rota: 'Biometria'},
        { nome: 'Juros', rota: 'Juros'},
        { nome: 'Mapa', rota: 'Mapa'},
        { nome: 'Todo', rota: 'Todo'},
    ];

    return (
        <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.titulo}>Perfil do usuário</Text>
        </View>

        <View style={styles.botoesContainer}>
            {botoes.map((botao) => (
            <TouchableOpacity
                key={botao.rota}
                style={styles.botao}
                onPress={() => navigation.navigate(botao.rota)}
            >
                <Text style={styles.textoBotao}>{botao.nome}</Text>
            </TouchableOpacity>
            ))}
        </View>
        </ScrollView>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 30,
        paddingBottom: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    botoesContainer: {
        padding: 20,
        gap: 12,
    },
    botao: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emoji: {
        fontSize: 24,
        marginRight: 12,
    },
    textoBotao: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    });