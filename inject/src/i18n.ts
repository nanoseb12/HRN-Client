export type AppLanguage = "en" | "es" | "pt";

type Translation = { en: string; es: string; pt: string; aliases?: string[] };

// Keep phrases exact: room names, player names, chat messages and user data must remain untouched.
const translations: Translation[] = [
    { en: "Play", es: "Jugar", pt: "Jogar" },
    { en: "About", es: "Acerca de", pt: "Sobre" },
    { en: "Community", es: "Comunidad", pt: "Comunidade" },
    { en: "Help", es: "Ayuda", pt: "Ajuda" },
    { en: "Settings", es: "Ajustes", pt: "Configurações", aliases: ["Configuración", "Options", "Opciones"] },
    { en: "Menu", es: "Menú", pt: "Menu" },
    { en: "Rooms", es: "Salas", pt: "Salas" },
    { en: "Room list", es: "Lista de salas", pt: "Lista de salas" },
    { en: "Create room", es: "Crear sala", pt: "Criar sala" },
    { en: "Create Room", es: "Crear sala", pt: "Criar sala" },
    { en: "Join", es: "Entrar", pt: "Entrar" },
    { en: "Join room", es: "Entrar a la sala", pt: "Entrar na sala" },
    { en: "Join Room", es: "Entrar a la sala", pt: "Entrar na sala" },
    { en: "Room name", es: "Nombre de la sala", pt: "Nome da sala" },
    { en: "Name", es: "Nombre", pt: "Nome" },
    { en: "Nickname", es: "Apodo", pt: "Apelido" },
    { en: "Password", es: "Contraseña", pt: "Senha" },
    { en: "Max players", es: "Máximo de jugadores", pt: "Máximo de jogadores" },
    { en: "Country", es: "País", pt: "País" },
    { en: "Region", es: "Región", pt: "Região" },
    { en: "Search", es: "Buscar", pt: "Buscar" },
    { en: "Search rooms", es: "Buscar salas", pt: "Buscar salas" },
    { en: "Players", es: "Jugadores", pt: "Jogadores" },
    { en: "Players online", es: "Jugadores en línea", pt: "Jogadores online" },
    { en: "Empty rooms", es: "Salas vacías", pt: "Salas vazias" },
    { en: "Full rooms", es: "Salas llenas", pt: "Salas lotadas" },
    { en: "No rooms found", es: "No se encontraron salas", pt: "Nenhuma sala encontrada" },
    { en: "Refresh", es: "Actualizar", pt: "Atualizar" },
    { en: "Refresh rooms", es: "Actualizar salas", pt: "Atualizar salas" },
    { en: "Favorites", es: "Favoritas", pt: "Favoritas" },
    { en: "Favorite", es: "Favorita", pt: "Favorita" },
    { en: "Recent rooms", es: "Salas recientes", pt: "Salas recentes" },
    { en: "Sort by", es: "Ordenar por", pt: "Ordenar por" },
    { en: "Ping", es: "Latencia", pt: "Latência" },
    { en: "Lock", es: "Bloquear", pt: "Bloquear" },
    { en: "Unlock", es: "Desbloquear", pt: "Desbloquear" },
    { en: "Auto", es: "Auto", pt: "Auto" },
    { en: "Random", es: "Aleatorio", pt: "Aleatório" },
    { en: "Red", es: "Rojo", pt: "Vermelho" },
    { en: "Blue", es: "Azul", pt: "Azul" },
    { en: "Spectators", es: "Espectadores", pt: "Espectadores" },
    { en: "Start game", es: "Iniciar partida", pt: "Iniciar partida" },
    { en: "Stop game", es: "Detener partida", pt: "Parar partida" },
    { en: "Reset", es: "Reiniciar", pt: "Reiniciar" },
    { en: "Pick", es: "Elegir", pt: "Escolher" },
    { en: "Record", es: "Grabar", pt: "Gravar" },
    { en: "Link", es: "Enlace", pt: "Link" },
    { en: "Leave", es: "Salir", pt: "Sair" },
    { en: "Leave room", es: "Salir de la sala", pt: "Sair da sala" },
    { en: "Time limit", es: "Límite de tiempo", pt: "Limite de tempo" },
    { en: "Score limit", es: "Límite de goles", pt: "Limite de gols" },
    { en: "Stadium", es: "Estadio", pt: "Estádio" },
    { en: "Classic", es: "Clásico", pt: "Clássico" },
    { en: "Start", es: "Iniciar", pt: "Iniciar" },
    { en: "Stop", es: "Detener", pt: "Parar" },
    { en: "Kick", es: "Expulsar", pt: "Expulsar" },
    { en: "Ban", es: "Expulsar permanentemente", pt: "Banir" },
    { en: "Kick player", es: "Expulsar jugador", pt: "Expulsar jogador" },
    { en: "Sounds enabled", es: "Sonidos activados", pt: "Sons ativados" },
    { en: "Chat sound enabled", es: "Sonido del chat activado", pt: "Som do chat ativado" },
    { en: "Nick highlight sound enabled", es: "Sonido al mencionar tu nombre activado", pt: "Som ao mencionar seu nome ativado" },
    { en: "Crowd sound enabled", es: "Sonido de público activado", pt: "Som da torcida ativado" },
    { en: "Sound", es: "Sonido", pt: "Som" },
    { en: "Video", es: "Video", pt: "Vídeo" },
    { en: "Input", es: "Controles", pt: "Controles" },
    { en: "Misc", es: "Varios", pt: "Outros" },
    { en: "Sounds", es: "Sonidos", pt: "Sons" },
    { en: "Sounds volume", es: "Volumen de sonidos", pt: "Volume dos sons" },
    { en: "Chat sounds", es: "Sonidos del chat", pt: "Sons do chat" },
    { en: "Crowd sounds", es: "Sonidos del público", pt: "Sons da torcida" },
    { en: "Background", es: "Fondo", pt: "Plano de fundo" },
    { en: "Chat background", es: "Fondo del chat", pt: "Fundo do chat" },
    { en: "Chat background opacity", es: "Opacidad del fondo del chat", pt: "Opacidade do fundo do chat" },
    { en: "Chat background width", es: "Ancho del fondo del chat", pt: "Largura do fundo do chat" },
    { en: "Full", es: "Completo", pt: "Completo" },
    { en: "Low latency canvas", es: "Canvas de baja latencia", pt: "Canvas de baixa latência" },
    { en: "Use low latency canvas", es: "Usar canvas de baja latencia", pt: "Usar canvas de baixa latência" },
    { en: "Show FPS", es: "Mostrar FPS", pt: "Mostrar FPS" },
    { en: "Extrapolation", es: "Extrapolación", pt: "Extrapolação" },
    { en: "Keys", es: "Teclas", pt: "Teclas" },
    { en: "Move", es: "Mover", pt: "Mover" },
    { en: "Kick", es: "Patear", pt: "Chutar", aliases: ["Kick key"] },
    { en: "Toggle chat", es: "Mostrar u ocultar chat", pt: "Mostrar ou ocultar chat" },
    { en: "Default", es: "Predeterminado", pt: "Padrão" },
    { en: "Enabled", es: "Activado", pt: "Ativado" },
    { en: "Disabled", es: "Desactivado", pt: "Desativado" },
    { en: "On", es: "Activado", pt: "Ativado" },
    { en: "Off", es: "Desactivado", pt: "Desativado" },
    { en: "Yes", es: "Sí", pt: "Sim" },
    { en: "No", es: "No", pt: "Não" },
    { en: "OK", es: "Aceptar", pt: "OK" },
    { en: "Cancel", es: "Cancelar", pt: "Cancelar" },
    { en: "Close", es: "Cerrar", pt: "Fechar" },
    { en: "Save", es: "Guardar", pt: "Salvar" },
    { en: "Apply", es: "Aplicar", pt: "Aplicar" },
    { en: "Create", es: "Crear", pt: "Criar" },
    { en: "Copy", es: "Copiar", pt: "Copiar" },
    { en: "Copied!", es: "¡Copiado!", pt: "Copiado!" },
    { en: "Copied to clipboard!", es: "¡Copiado al portapapeles!", pt: "Copiado para a área de transferência!" },
    { en: "Invalid password", es: "Contraseña incorrecta", pt: "Senha inválida" },
    { en: "Room is full", es: "La sala está llena", pt: "A sala está lotada" },
    { en: "Connection failed", es: "Error de conexión", pt: "Falha na conexão" },
    { en: "Disconnected", es: "Desconectado", pt: "Desconectado" },
    { en: "Connecting...", es: "Conectando...", pt: "Conectando..." },
    { en: "Loading...", es: "Cargando...", pt: "Carregando..." },
    { en: "Room", es: "Sala", pt: "Sala" },
    { en: "Open room", es: "Abrir sala", pt: "Abrir sala" },
    { en: "You", es: "Tú", pt: "Você" },
    { en: "Spectate", es: "Observar", pt: "Assistir" },
    { en: "Join the game", es: "Unirse a la partida", pt: "Entrar no jogo" },
    { en: "Game started", es: "Partida iniciada", pt: "Partida iniciada" },
    { en: "Game stopped", es: "Partida detenida", pt: "Partida parada" },
    { en: "was kicked", es: "fue expulsado", pt: "foi expulso" },
    { en: "was banned", es: "fue bloqueado", pt: "foi banido" },
    { en: "Haxball", es: "Haxball", pt: "Haxball" },
    { en: "HaxBall", es: "HaxBall", pt: "HaxBall" },

    // HRN Client and racing HUD
    { en: "Open HaxBall", es: "Abrir HaxBall", pt: "Abrir HaxBall" },
    { en: "Community", es: "Comunidad", pt: "Comunidade" },
    { en: "Paste a room link", es: "Pega un enlace de sala", pt: "Cole um link de sala", aliases: ["Pega un enlace de sala"] },
    { en: "Invalid link", es: "Enlace inválido", pt: "Link inválido" },
    { en: "Joining room...", es: "Entrando a la sala…", pt: "Entrando na sala…" },
    { en: "About", es: "Acerca de", pt: "Sobre" },
    { en: "Help", es: "Ayuda", pt: "Ajuda" },
    { en: "Settings", es: "Ajustes", pt: "Configurações" },
    { en: "Show bar", es: "Mostrar barra", pt: "Mostrar barra" },
    { en: "Default UI", es: "Interfaz normal", pt: "Interface padrão" },
    { en: "Glass UI", es: "Interfaz de cristal", pt: "Interface de vidro" },
    { en: "HUD", es: "HUD", pt: "HUD" },
    { en: "Client", es: "Cliente", pt: "Cliente" },
    { en: "Optimization", es: "Optimización", pt: "Otimização" },
    { en: "Language", es: "Idioma", pt: "Idioma" },
    { en: "Language of the client and HaxBall", es: "Idioma del cliente y de HaxBall", pt: "Idioma do cliente e do HaxBall" },
    { en: "Racing HUD", es: "HUD de carreras", pt: "HUD de corrida" },
    { en: "Configure the HUD data, dashboard and car presets here.", es: "Configura los datos, el dashboard y los presets del coche desde este panel.", pt: "Configure os dados, o painel e os presets do carro neste painel." },
    { en: "Last lap time", es: "Tiempo de la última vuelta", pt: "Tempo da última volta" },
    { en: "Lap counter", es: "Contador de vueltas", pt: "Contador de voltas" },
    { en: "Speed", es: "Velocidad", pt: "Velocidade" },
    { en: "Gear", es: "Marcha", pt: "Marcha" },
    { en: "Show pressed keys", es: "Mostrar teclas presionadas", pt: "Mostrar teclas pressionadas" },
    { en: "Dashboard style", es: "Estilo del dashboard", pt: "Estilo do painel" },
    { en: "Scoreboard style", es: "Estilo del marcador", pt: "Estilo do placar" },
    { en: "Scoreboard position", es: "Posición del marcador", pt: "Posição do placar" },
    { en: "Keys to show", es: "Teclas que se muestran", pt: "Teclas exibidas" },
    { en: "Key position", es: "Posición de las teclas", pt: "Posição das teclas" },
    { en: "Preset car", es: "Preset de coche", pt: "Preset do carro" },
    { en: "Select a preset...", es: "Seleccionar preset…", pt: "Selecionar preset…" },
    { en: "Included", es: "Incluidos", pt: "Incluídos" },
    { en: "My presets", es: "Mis presets", pt: "Meus presets" },
    { en: "Speed multiplier", es: "Multiplicador de velocidad", pt: "Multiplicador de velocidade" },
    { en: "Maximum speed (km/h)", es: "Velocidad máxima (km/h)", pt: "Velocidade máxima (km/h)" },
    { en: "Shift points by gear (% of top speed)", es: "Puntos de cambio por marcha (% de velocidad máxima)", pt: "Pontos de troca por marcha (% da velocidade máxima)" },
    { en: "Name for my preset", es: "Nombre para mi preset", pt: "Nome do meu preset" },
    { en: "Example: room GT3", es: "Ej.: GT3 de la sala", pt: "Ex.: GT3 da sala" },
    { en: "Save preset", es: "Guardar preset", pt: "Salvar preset" },
    { en: "Delete selected", es: "Eliminar seleccionado", pt: "Excluir selecionado" },
    { en: "Save HUD", es: "Guardar HUD", pt: "Salvar HUD" },
    { en: "Lap", es: "Vuelta", pt: "Volta" },
    { en: "Last lap", es: "Última vuelta", pt: "Última volta" },
    { en: "Waiting for start", es: "Esperando salida", pt: "Aguardando largada" },
    { en: "GO!", es: "¡Salida!", pt: "Largada!" },
    { en: "Driving controls", es: "Teclas de conducción", pt: "Teclas de direção" },
    { en: "Original HaxBall position (top center)", es: "Original de HaxBall (centro arriba)", pt: "Original do HaxBall (centro superior)" },
    { en: "Default (top left)", es: "Predeterminada (arriba a la izquierda)", pt: "Padrão (canto superior esquerdo)" },
    { en: "Top left", es: "Arriba a la izquierda", pt: "Superior esquerdo" },
    { en: "Bottom left", es: "Abajo a la izquierda", pt: "Inferior esquerdo" },
    { en: "Bottom center", es: "Abajo al centro", pt: "Inferior central" },
    { en: "Bottom right", es: "Abajo a la derecha", pt: "Inferior direito" },
    { en: "Top right", es: "Arriba a la derecha", pt: "Superior direito" },
    { en: "Normal", es: "Normal", pt: "Normal" },
    { en: "F1", es: "F1", pt: "F1" },
    { en: "F1 Vintage", es: "F1 Vintage", pt: "F1 Vintage" },
    { en: "WEC", es: "WEC", pt: "WEC" },
    { en: "Porsche Cup", es: "Porsche Cup", pt: "Porsche Cup" },
    { en: "Haxball Racing Series", es: "Haxball Racing Series", pt: "Haxball Racing Series" },
    { en: "Save", es: "Guardar", pt: "Salvar" },
    { en: "Restore", es: "Restaurar", pt: "Restaurar" },
    { en: "Export backup", es: "Exportar respaldo", pt: "Exportar backup" },
    { en: "Restore backup", es: "Restaurar respaldo", pt: "Restaurar backup" },
    { en: "Reset client", es: "Restablecer cliente", pt: "Redefinir cliente" },
    { en: "Camera", es: "Cámara", pt: "Câmera" },
    { en: "Move the camera farther away to see more of the track. This scales the game page, including chat and HUD.", es: "Aleja la vista para abarcar más pista. Este control escala la página del juego, por lo que también cambia el tamaño del chat y el HUD.", pt: "Afaste a câmera para ver mais da pista. Este controle dimensiona a página do jogo, incluindo o chat e o HUD." },
    { en: "Reset", es: "Restablecer", pt: "Redefinir" },
    { en: "Performance", es: "Rendimiento", pt: "Desempenho" },
    { en: "Restart the client to apply performance changes.", es: "Reinicia el cliente para aplicar cambios de rendimiento.", pt: "Reinicie o cliente para aplicar as alterações de desempenho." },
    { en: "Restart the client to apply FPS limit changes.", es: "Reinicia el cliente para aplicar cambios del límite de FPS.", pt: "Reinicie o cliente para aplicar alterações no limite de FPS." },
    { en: "Optimization profile", es: "Perfil de optimización", pt: "Perfil de otimização" },
    { en: "Balanced", es: "Equilibrado", pt: "Equilibrado" },
    { en: "Maximum smoothness", es: "Máxima fluidez", pt: "Fluidez máxima" },
    { en: "Custom", es: "Personalizado", pt: "Personalizado" },
    { en: "Low latency and Show FPS are configured in HaxBall's Video tab.", es: "La baja latencia y Mostrar FPS se configuran en la pestaña Video de HaxBall.", pt: "A baixa latência e Mostrar FPS são configurados na aba Vídeo do HaxBall." },
    { en: "Open Video settings", es: "Abrir ajustes de Video", pt: "Abrir configurações de Vídeo" },
    { en: "Frames per second", es: "Fotogramas por segundo", pt: "Quadros por segundo" },
    { en: "Unlimited", es: "Sin límite", pt: "Ilimitado" },
    { en: "Discord status", es: "Estado en Discord", pt: "Status no Discord" },
    { en: "Shortcuts", es: "Atajos", pt: "Atalhos" },
    { en: "Create shortcuts for commands, messages and frequently used emojis in chat.", es: "Crea abreviaturas para comandos, mensajes y emojis frecuentes en el chat.", pt: "Crie atalhos para comandos, mensagens e emojis usados com frequência no chat." },
    { en: "Create shortcut", es: "Crear atajo", pt: "Criar atalho" },
    { en: "View shortcuts", es: "Ver atajos", pt: "Ver atalhos" },
    { en: "HaxBall identity", es: "Identidad de Haxball", pt: "Identidade do HaxBall" },
    { en: "View identity", es: "Ver identidad", pt: "Ver identidade" },
    { en: "Change identity", es: "Cambiar identidad", pt: "Alterar identidade" },
    { en: "New identity", es: "Nueva identidad", pt: "Nova identidade" },
    { en: "Backup and reset", es: "Respaldo y reinicio", pt: "Backup e redefinição" },
    { en: "Export or restore profiles, shortcuts and settings. You can also reset the client.", es: "Exporta o restaura perfiles, atajos y ajustes. También puedes reiniciar el cliente.", pt: "Exporte ou restaure perfis, atalhos e configurações. Você também pode redefinir o cliente." },
    { en: "Settings", es: "Ajustes", pt: "Configurações" },
    { en: "HRN Settings", es: "Ajustes de Haxracing", pt: "Configurações do HRN" },
    { en: "About Haxracing", es: "Acerca de Haxracing", pt: "Sobre o Haxracing" },
    { en: "Manage Profiles", es: "Administrar perfiles", pt: "Gerenciar perfis" },
    { en: "Create New Profile", es: "Crear perfil nuevo", pt: "Criar novo perfil" },
    { en: "New Profile", es: "Perfil nuevo", pt: "Novo perfil" },
    { en: "Profile name:", es: "Nombre del perfil:", pt: "Nome do perfil:" },
    { en: "Enter a profile name", es: "Escribe un nombre para el perfil", pt: "Digite um nome para o perfil" },
    { en: "Nick:", es: "Apodo:", pt: "Apelido:" },
    { en: "Choose a nickname (can be modified later)", es: "Elige un apodo (puedes cambiarlo después)", pt: "Escolha um apelido (pode ser alterado depois)" },
    { en: "Selected", es: "Seleccionado", pt: "Selecionado" },
    { en: "Select", es: "Seleccionar", pt: "Selecionar" },
    { en: "Save Profile", es: "Guardar perfil", pt: "Salvar perfil" },
    { en: "Undo Save", es: "Deshacer guardado", pt: "Desfazer salvamento" },
    { en: "Delete", es: "Eliminar", pt: "Excluir" },
    { en: "Undo Delete", es: "Deshacer eliminación", pt: "Desfazer exclusão" },
    { en: "Apply Changes", es: "Aplicar cambios", pt: "Aplicar alterações" },
    { en: "Will be deleted", es: "Se eliminará", pt: "Será excluído" },
    { en: "Will be saved", es: "Se guardará", pt: "Será salvo" },
    { en: "Avatar", es: "Avatar", pt: "Avatar" },
    { en: "Location Override", es: "Ubicación personalizada", pt: "Localização personalizada" },
    { en: "Favorite Rooms", es: "Salas favoritas", pt: "Salas favoritas" },
    { en: "Autosave", es: "Guardado automático", pt: "Salvamento automático" },
    { en: "Auth", es: "Identidad", pt: "Identidade" },
    { en: "New Identity", es: "Nueva identidad", pt: "Nova identidade" },
    { en: "Current Identity", es: "Identidad actual", pt: "Identidade atual" },
    { en: "Create Profile", es: "Crear perfil", pt: "Criar perfil" },
    { en: "Apply New Auth", es: "Aplicar identidad nueva", pt: "Aplicar nova identidade" },
    { en: "Copy Public Auth", es: "Copiar identidad pública", pt: "Copiar identidade pública" },
    { en: "Copy Private Key", es: "Copiar clave privada", pt: "Copiar chave privada" },
    { en: "Private Key:", es: "Clave privada:", pt: "Chave privada:" },
    { en: "If the text turns red, you are copying the wrong thing", es: "Si el texto se pone rojo, copiaste algo incorrecto", pt: "Se o texto ficar vermelho, você copiou algo errado" },
    { en: "New shortcut", es: "Atajo nuevo", pt: "Novo atalho" },
    { en: "What you type here...", es: "Lo que escribas aquí...", pt: "O que você digitar aqui..." },
    { en: "...turns into what you type here", es: "...se convierte en lo que escribas aquí", pt: "...se transforma no que você digitar aqui" },
    { en: "Save shortcut", es: "Guardar atajo", pt: "Salvar atalho" },
    { en: "Shortcut saved!", es: "¡Atajo guardado!", pt: "Atalho salvo!" },
    { en: "Create a text shortcut that expands when written in chat.", es: "Crea un atajo de texto que se expande al escribirlo en el chat.", pt: "Crie um atalho de texto que se expande ao digitá-lo no chat." },
    { en: "Create a new shortcut", es: "Crear un atajo nuevo", pt: "Criar um novo atalho" },
    { en: "Your shortcuts", es: "Tus atajos", pt: "Seus atalhos" },
    { en: "You haven't saved any shortcuts!", es: "¡Todavía no guardaste atajos!", pt: "Você ainda não salvou nenhum atalho!" },
    { en: "Download now", es: "Descargar ahora", pt: "Baixar agora" },
    { en: "New update available!", es: "¡Hay una actualización nueva!", pt: "Há uma nova atualização disponível!" },
    { en: "Confirm Reset", es: "Confirmar reinicio", pt: "Confirmar redefinição" },
    { en: "Reset successful", es: "Reinicio completado", pt: "Redefinição concluída" },
    { en: "The page will reload in a few seconds.", es: "La página se recargará en unos segundos.", pt: "A página será recarregada em alguns segundos." },
    { en: "Are you sure?", es: "¿Estás seguro?", pt: "Tem certeza?" },
    { en: "Auth changed", es: "Identidad cambiada", pt: "Identidade alterada" },
    { en: "Change Auth", es: "Cambiar identidad", pt: "Alterar identidade" },
    { en: "Changelog", es: "Novedades", pt: "Novidades" },
    { en: "Restore Backup", es: "Restaurar respaldo", pt: "Restaurar backup" },
    { en: "Backup restored", es: "Respaldo restaurado", pt: "Backup restaurado" },
    { en: "Invalid backup!", es: "¡Respaldo inválido!", pt: "Backup inválido!" },
    { en: "Invalid backup", es: "Respaldo inválido", pt: "Backup inválido" },
    { en: "The app will restart in a few seconds (or do it manually)...", es: "El cliente se reiniciará en unos segundos (o puedes hacerlo manualmente)...", pt: "O cliente será reiniciado em alguns segundos (ou você pode fazer isso manualmente)..." },
    { en: "Reset client", es: "Restablecer cliente", pt: "Redefinir cliente" },
    { en: "This operation will reset the app and delete all your settings.", es: "Esta operación reiniciará el cliente y eliminará todos tus ajustes.", pt: "Esta operação reiniciará o cliente e apagará todas as suas configurações." },
    { en: "Your public auth is used by room administrators to identify you when you join their room.", es: "Los administradores usan tu identidad pública para reconocerte al entrar a sus salas.", pt: "Os administradores usam sua identidade pública para reconhecer você ao entrar nas salas." },
    { en: "Your private key is only visible to you and can be used to change your public auth.", es: "Solo tú puedes ver tu clave privada. Sirve para cambiar tu identidad pública.", pt: "Só você pode ver sua chave privada. Ela pode ser usada para alterar sua identidade pública." },
    { en: "Be careful! If someone discovered your private key, they could use it to impersonate you.", es: "¡Cuidado! Si alguien obtiene tu clave privada, podría hacerse pasar por ti.", pt: "Cuidado! Se alguém descobrir sua chave privada, poderá se passar por você." },
    { en: "Public auth", es: "Identidad pública", pt: "Identidade pública" },
    { en: "Private key", es: "Clave privada", pt: "Chave privada" },
    { en: "By resetting your auth you may lose your identity in public rooms.", es: "Si cambias tu identidad, podrías dejar de ser reconocido en salas públicas.", pt: "Ao redefinir sua identidade, você poderá deixar de ser reconhecido em salas públicas." },
    { en: "You can use a different auth by entering its private key below.", es: "Puedes usar otra identidad introduciendo su clave privada aquí abajo.", pt: "Você pode usar outra identidade digitando a chave privada abaixo." },
    { en: "For example, if you previously used a different browser or device, you can restore your old identity by visiting:", es: "Por ejemplo, si antes usabas otro navegador o dispositivo, puedes recuperar tu identidad anterior visitando:", pt: "Por exemplo, se você usava outro navegador ou dispositivo, pode restaurar sua identidade acessando:" },
    { en: "Copy the Private Key from that page and paste it into the box below.", es: "Copia la clave privada de esa página y pégala en el campo de abajo.", pt: "Copie a chave privada dessa página e cole no campo abaixo." },
    { en: "The app will restart in a few seconds (or do it manually)...", es: "El cliente se reiniciará en unos segundos (o puedes hacerlo manualmente)...", pt: "O cliente será reiniciado em alguns segundos (ou você pode fazer isso manualmente)..." },
    { en: "You're creating a new profile.", es: "Estás creando un perfil nuevo.", pt: "Você está criando um novo perfil." },
    { en: "This profile will have its own", es: "Este perfil tendrá su propio", pt: "Este perfil terá seu próprio" },
    { en: "Confirm", es: "Confirmar", pt: "Confirmar" },
    { en: "Cancel", es: "Cancelar", pt: "Cancelar" },
    { en: "Flechas", es: "Flechas", pt: "Setas" },
    { en: "Haxracing settings", es: "Ajustes de Haxracing", pt: "Configurações do Haxracing" },
    { en: "Language", es: "Idioma", pt: "Idioma" },
    { en: "Normal", es: "Normal", pt: "Normal" },
    { en: "Export backup", es: "Exportar respaldo", pt: "Exportar backup" },
    { en: "View favorites", es: "Ver favoritas", pt: "Ver favoritas" },
    { en: "Add favorite", es: "Agregar favorita", pt: "Adicionar favorita" },
    { en: "Show all", es: "Mostrar todas", pt: "Mostrar todas" },
    { en: "Remove favorite", es: "Quitar favorita", pt: "Remover favorita" },
    { en: "Changes applied!", es: "¡Cambios aplicados!", pt: "Alterações aplicadas!" },
    { en: "New profile created!", es: "¡Perfil nuevo creado!", pt: "Novo perfil criado!" },
    { en: "New Identity", es: "Identidad nueva", pt: "Nova identidade" },
    { en: "Current Identity", es: "Identidad actual", pt: "Identidade atual" },
    { en: "ON", es: "Activado", pt: "Ativado" },
    { en: "OFF", es: "Desactivado", pt: "Desativado" },
    { en: "(no avatar)", es: "(sin avatar)", pt: "(sem avatar)" },
    { en: "(no override)", es: "(sin personalizar)", pt: "(sem personalização)" },
    { en: "(no rooms)", es: "(sin salas)", pt: "(sem salas)" },
    { en: "Time", es: "Tiempo", pt: "Tempo" },
    { en: "Goal limit", es: "Límite de goles", pt: "Limite de gols" },
    { en: "Join as spectator", es: "Entrar como espectador", pt: "Entrar como espectador" },
    { en: "Show bar", es: "Mostrar barra", pt: "Mostrar barra" },
    { en: "Paste a room link", es: "Pega un enlace de sala", pt: "Cole um link de sala" },
    { en: "Room link", es: "Enlace de sala", pt: "Link da sala" },
    { en: "Speed reading requires HaxBall physics to be exposed by the client. Gears are calculated by thresholds; the last percentage must always be 100%.", es: "La lectura de velocidad requiere que el cliente exponga la física de HaxBall. Las marchas se calculan por umbrales; el último porcentaje siempre representa el 100 %.", pt: "A leitura da velocidade exige que o cliente exponha a física do HaxBall. As marchas são calculadas por limites; a última porcentagem deve ser sempre 100%." },
    { en: "No preset selected...", es: "Seleccionar preset…", pt: "Selecionar preset…" },
    { en: "Original HaxBall position (top center)", es: "Original de HaxBall (centro arriba)", pt: "Original do HaxBall (centro superior)" },
    { en: "Default (top left)", es: "Predeterminada (arriba a la izquierda)", pt: "Padrão (canto superior esquerdo)" },
    { en: "Teclas de conducción", es: "Teclas de conducción", pt: "Teclas de direção" },
    { en: "WAITING FOR START", es: "ESPERANDO SALIDA", pt: "AGUARDANDO LARGADA", aliases: ["ESPERANDO SALIDA", "AGUARDANDO LARGADA"] },
    { en: "GO!", es: "¡SALIDA!", pt: "LARGADA!", aliases: ["¡SALIDA!", "LARGADA!"] },
    { en: "VUELTA", es: "VUELTA", pt: "VOLTA" },
    { en: "VELOCIDAD", es: "VELOCIDAD", pt: "VELOCIDADE" },
    { en: "MARCHA", es: "MARCHA", pt: "MARCHA" },
    { en: "ÚLTIMA VUELTA", es: "ÚLTIMA VUELTA", pt: "ÚLTIMA VOLTA" },
    { en: "LAP", es: "VUELTA", pt: "VOLTA", aliases: ["VUELTA", "VOLTA"] },
    { en: "SPEED", es: "VELOCIDAD", pt: "VELOCIDADE", aliases: ["VELOCIDAD", "VELOCIDADE"] },
    { en: "GEAR", es: "MARCHA", pt: "MARCHA", aliases: ["MARCHA"] },
    { en: "LAST LAP", es: "ÚLTIMA VUELTA", pt: "ÚLTIMA VOLTA", aliases: ["ÚLTIMA VUELTA", "ÚLTIMA VOLTA"] },
    { en: "Open HaxBall or visit the community to find information and support.", es: "Abre HaxBall o visita la comunidad para encontrar información y soporte.", pt: "Abra o HaxBall ou visite a comunidade para encontrar informações e suporte." },
    { en: "Community client for HaxBall focused on racing. It keeps the original game and adds tools for the Haxracing community.", es: "Cliente comunitario de HaxBall enfocado en carreras. Mantiene el juego original y añade herramientas para la comunidad Haxracing.", pt: "Cliente comunitário do HaxBall focado em corridas. Mantém o jogo original e adiciona ferramentas para a comunidade Haxracing." },
    { en: "The profile will have its own", es: "Este perfil tendrá su propio", pt: "Este perfil terá seu próprio" },
    { en: "• Nickname", es: "• Apodo", pt: "• Apelido" },
    { en: "• Auth", es: "• Identidad", pt: "• Identidade" },
    { en: "• Avatar", es: "• Avatar", pt: "• Avatar" },
    { en: "• Extrapolation", es: "• Extrapolación", pt: "• Extrapolação" },
    { en: "• Location override", es: "• Ubicación personalizada", pt: "• Localização personalizada" },
    { en: "• Favorite rooms", es: "• Salas favoritas", pt: "• Salas favoritas" },
    { en: "Autosave option:", es: "Opción de guardado automático:", pt: "Opção de salvamento automático:" },
    { en: "Identity option:", es: "Opción de identidad:", pt: "Opção de identidade:" },
    { en: "English", es: "English", pt: "English" },
    { en: "Español", es: "Español", pt: "Español" },
    { en: "Português", es: "Português", pt: "Português" },
];

const normalize = (value: string): string => value.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase();
const translationByAlias = new Map<string, Translation>();
translations.forEach(entry => [entry.en, entry.es, entry.pt, ...(entry.aliases || [])].forEach(alias => translationByAlias.set(normalize(alias), entry)));

let currentLanguage: AppLanguage = "es";
const observedDocuments = new Map<Document, MutationObserver>();

const isLanguage = (value: unknown): value is AppLanguage => value === "en" || value === "es" || value === "pt";
const translateValue = (value: string): string => {
    const key = normalize(value);
    const translated = translationByAlias.get(key)?.[currentLanguage];
    if (!translated) return value;
    const leading = value.match(/^\s*/)?.[0] || "";
    const trailing = value.match(/\s*$/)?.[0] || "";
    return `${leading}${translated}${trailing}`;
};

const shouldSkipText = (node: Node): boolean => {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest("script,style,textarea,code,pre,[contenteditable='true'],.log-contents,.chatbox-view-contents .log,.player-list-view [data-hook='name'],.room-entry [data-hook='name'],.room-card [data-hook='name']")) return true;
    return false;
};

const translateSubtree = (doc: Document, root: Node): void => {
    if (root.nodeType === 3 && !shouldSkipText(root)) {
        const oldValue = root.nodeValue || "";
        const newValue = translateValue(oldValue);
        if (newValue !== oldValue) root.nodeValue = newValue;
        return;
    }
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        if (shouldSkipText(node)) continue;
        const oldValue = node.nodeValue || "";
        const newValue = translateValue(oldValue);
        if (newValue !== oldValue) node.nodeValue = newValue;
    }

    const elements: Element[] = [];
    const isElement = root.nodeType === 1;
    const isDocument = root.nodeType === 9;
    if (isElement) elements.push(root as Element);
    if (isElement || isDocument) elements.push(...Array.from((root as ParentNode).querySelectorAll("*")));
    elements.forEach(element => {
        if (element.closest(".log-contents,.player-list-view [data-hook='name'],.room-entry [data-hook='name'],.room-card [data-hook='name']")) return;
        ["placeholder", "title", "aria-label", "alt"].forEach(attribute => {
            const oldValue = element.getAttribute(attribute);
            if (!oldValue) return;
            const newValue = translateValue(oldValue);
            if (newValue !== oldValue) element.setAttribute(attribute, newValue);
        });
        if (element.tagName === "INPUT" && ["button", "submit"].includes((element as HTMLInputElement).type)) {
            const input = element as HTMLInputElement;
            const newValue = translateValue(input.value);
            if (newValue !== input.value) input.value = newValue;
        }
    });
};

export const attachLocalization = (doc: Document | null | undefined): void => {
    if (!doc?.documentElement || observedDocuments.has(doc)) return;
    translateSubtree(doc, doc.documentElement);
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === "characterData") {
                translateSubtree(doc, mutation.target);
            }
            mutation.addedNodes.forEach(node => translateSubtree(doc, node));
            if (mutation.type === "attributes" && mutation.target.nodeType === 1) translateSubtree(doc, mutation.target);
        });
    });
    observer.observe(doc.documentElement, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["placeholder", "title", "aria-label", "alt"],
    });
    observedDocuments.set(doc, observer);
};

export const getLocalizationLanguage = (): AppLanguage => currentLanguage;

export const initializeLocalization = async (): Promise<void> => {
    try {
        const prefs = await window.electronAPI.getAppPreferences();
        if (isLanguage(prefs?.language)) currentLanguage = prefs.language;
    } catch { /* Keep Spanish as the first-run default. */ }
    attachLocalization(document);
};

export const setLocalizationLanguage = async (language: AppLanguage): Promise<void> => {
    currentLanguage = language;
    await window.electronAPI.setAppPreference("language", language);
    attachLocalization(document);
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
    attachLocalization(gameframe?.contentDocument);
    observedDocuments.forEach((_observer, doc) => translateSubtree(doc, doc.documentElement));
};
