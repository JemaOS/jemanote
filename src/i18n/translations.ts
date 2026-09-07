// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

// ============ INTERNATIONALIZATION ============

export const LANGUAGES = {
  en: { code: 'en', name: 'English' },
  fr: { code: 'fr', name: 'Français' },
} as const;

export type Lang = keyof typeof LANGUAGES;

export type TranslationParams = Record<string, string | number>;

export type TranslateFn = (key: string, params?: TranslationParams) => string;

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Common UI
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    rename: 'Rename',
    restore: 'Restore',
    untitled: 'Untitled',
    untitledLowercase: 'untitled',
    loading: 'Loading...',
    generating: 'Generating...',
    processing: 'Processing...',
    search: 'Search',
    searchTitle: 'Search',
    menu: 'Menu',
    language: 'Language',
    newNote: 'New note',
    noteTitleWithDate: 'Note {date}',
    noContent: 'No content',
    note: 'Note',
    noteCount: '({count} note{suffix})',

    // Navigation
    mainNavigation: 'Main navigation',
    hideSidebar: 'Hide sidebar',
    showSidebar: 'Show sidebar',
    searchNotesPlaceholder: 'Search notes...',
    workspace: 'Workspace',
    canvas: 'Canvas',
    timeline: 'Timeline',
    settings: 'Settings',
    hideInspector: 'Hide inspector',
    showInspector: 'Show inspector',
    signOut: 'Sign out',
    signIn: 'Sign in',
    signInToSync: 'Sign in to sync',
    login: 'Sign in',
    register: 'Sign up',
    closeMenu: 'Close menu',

    // Sidebar
    restoreFolderAndNotes: 'Restore folder and its notes',
    deletePermanently: 'Delete permanently',
    exitSelectionMode: 'Exit selection mode',
    selectionMode: 'Selection mode',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    notes: 'Notes',
    deleteSelection: 'Delete selection',
    deleteWithCount: 'Delete ({count})',
    trash: 'Trash',
    trashEmpty: 'Trash is empty',
    restoreSelection: 'Restore selection',
    restoreWithCount: 'Restore ({count})',
    emptyTrash: 'Empty trash',
    emptyAll: 'Empty all',
    folderNamePlaceholder: 'Folder name...',
    newFolder: 'New folder',
    folders: 'Folders',
    deleteSelectedFolders: 'Delete selected folders',
    folderAriaLabel: 'Folder {name}',
    createNoteInFolder: 'Create a note in this folder',
    renameFolder: 'Rename folder',
    deleteFolder: 'Delete folder',
    unfiledNotes: 'Unfiled notes',
    unfiled: 'Unfiled',
    createUnfiledNote: 'Create an unfiled note',
    noNotes: 'No notes.',
    createNoteToStart: 'Create one to get started.',
    metadata: 'Metadata',
    noteIdLabel: 'Note ID',
    selectNoteForDetails: 'Select a note to see details',
    deleteFolderConfirmWithNotes:
      'Delete this folder? The {count} note(s) will be moved to the trash.',
    deleteFolderConfirmEmpty: 'Delete this empty folder?',
    deleteFolderPermanentlyWithNotes:
      'This action is irreversible. The folder "{name}" and its {count} note(s) will be permanently deleted.',
    deleteFolderPermanentlyConfirm:
      'This action is irreversible. Permanently delete the folder "{name}"?',
    deleteSelectedFoldersConfirmWithNotes:
      'Delete {count} selected folder(s)? The {countNotes} note(s) will be moved to the trash.',
    deleteSelectedEmptyFoldersConfirm: 'Delete {count} selected empty folder(s)?',
    deleteSelectedNotesConfirm: 'Delete {count} selected note(s)?',
    emptyTrashConfirm:
      'This action is irreversible. Permanently delete {count} item(s) from the trash?',
    deleteSelectedItemsConfirm:
      'This action is irreversible. Permanently delete {count} selected item(s)?',
    deleteNoteConfirm: 'Are you sure you want to delete this note?',
    deletePermanentlyConfirm: 'This action is irreversible. Delete permanently?',
    moveTo: 'Move to...',
    noteAriaLabel: 'Note: {title}',

    // StatusBar
    syncing: 'Syncing...',
    synced: 'Synced',
    disconnected: 'Disconnected',
    syncNow: 'Sync now',
    enable: 'Enable',
    signInToSyncStatus: 'Sign in to sync your notes',
    localModeClickToSync: 'Local Mode - Click to enable cloud sync',
    local: 'Local',
    lastModified: 'Last modified: {time}',
    developedBy: 'Developed by',
    footerLicense: '© 2025 • Open Source & AGPL licensed',
    modeEdit: 'Mode: Edit',
    editShort: 'Edit',

    // WorkspaceView
    noNoteSelected: 'No note selected',
    selectOrCreateNote: 'Select a note in the sidebar or create a new one',
    noteIsLong: 'Your note is getting long!',
    generateSummaryWithAI: 'Generate an automatic summary with AI.',
    generate: 'Generate',
    noteTitlePlaceholder: 'Note title',
    recordVoiceNote: 'Record a voice note with transcription',
    generateAISummary: 'Generate a summary with AI',
    summary: 'Summary',
    openAIAssistant: 'Open AI Assistant',
    aiAssistant: 'AI Assistant',
    editMode: 'Edit mode',
    splitMode: 'Split mode',
    previewMode: 'Preview mode',
    voiceMemo: 'Voice memo',
    voiceMemoSaveError: 'Error saving the voice memo',

    // SearchView
    resultsFound: '{count} result{suffix} found',
    searchAllNotesPlaceholder: 'Search all your notes...',
    modifiedOn: 'Modified on {date}',
    noResultsFor: 'No results found for "{query}"',
    startTypingToSearch: 'Start typing to search your notes',

    // SettingsView
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    editor: 'Editor',
    lineNumbers: 'Line numbers',
    autoSave: 'Auto-save',
    vimMode: 'Vim mode',
    keyboardShortcuts: 'Keyboard shortcuts',
    openCommandPalette: 'Open the command palette',
    createNewNote: 'Create a new note',
    saveNoteShortcut: 'Save the note',
    searchInNotes: 'Search notes',
    toggleThemeShortcut: 'Toggle light/dark theme',
    boldText: 'Bold text',
    italicText: 'Italic text',
    undo: 'Undo',
    redo: 'Redo',
    closeActivePanel: 'Close the active panel',
    escapeKey: 'Esc',
    cloudSync: 'Cloud Sync',
    syncEnabledLabel: 'Sync enabled',
    syncInterval: 'Sync interval (seconds)',

    // TimelineView & DateFilter
    notesTimeline: 'Notes timeline',
    modified: 'Modified',
    created: 'Created',
    modifiedLabel: 'Modified: {time}',
    createdLabel: 'Created: {date}',
    noNotesForDate: 'No notes found for this date.',
    noNotesInHistory: 'No notes in the history.',
    filterByDate: 'Filter by date',
    chooseDate: 'Choose a date',
    clear: 'Clear',

    // CanvasView
    deleteCanvasSelectionConfirm:
      'Do you want to delete {count} item(s) from the canvas and move the {noteCount} note(s) to the trash?',
    deleteCanvasNoteConfirm:
      'Do you want to delete the original note and move it to the trash?',
    selectedCount: '{count} selected',
    clearSelection: 'Clear selection',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    multiSelectMode: 'Multi-select mode',
    addNote: 'Add a note',
    nodeAriaLabel: 'Node {title}',
    drawingArea: 'Drawing area',
    emptyCanvas: 'Empty canvas',
    emptyCanvasHint: 'Click the + button to add elements',
    emptyCanvasPanHint: 'Drag to move the view, use the controls to zoom',

    // CommandPalette
    closeCommandPalette: 'Close the command palette',
    commandPalettePlaceholder: 'Search commands or notes...',
    noResults: 'No results found',
    actions: 'Actions',
    switchToDarkMode: 'Switch to dark mode',
    switchToLightMode: 'Switch to light mode',
    views: 'Views',
    active: 'Active',

    // Auth
    signUp: 'Sign up',
    cloudSyncDesc: 'Sign in to sync your notes across all your devices',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    anErrorOccurred: 'An error occurred',
    localNotesSyncAfterLogin:
      'Your local notes will be automatically synced after signing in',
    professionalNoteApp: 'Professional note-taking application',
    authInvalidCredentials: 'Incorrect email or password. Please check your credentials.',
    authEmailNotConfirmed:
      "Your email has not been confirmed. Please check your inbox.",
    authUserNotFound: 'No account found with this email.',
    authEmailAlreadyRegistered: 'An account already exists with this email.',
    authPasswordTooShort: 'The password must contain at least 6 characters.',
    authNetworkError:
      'Connection problem. Please check your internet connection.',
    authRateLimit: 'Too many attempts. Please try again later.',
    authInvalidEmail: 'The email address is not valid.',
    authGenericError: 'An error occurred. Please try again.',

    // AIPanel
    noNoteOrEmpty: 'No note selected or note is empty',
    summaryGenerationError: 'Error generating the summary',
    mistralNotConfigured:
      "⚠️ Missing configuration: The Mistral API key is not configured on the Supabase server. Please follow the setup instructions in the documentation.",
    mistralKeyInvalid:
      '🔑 Invalid API key: The configured Mistral API key is invalid or expired. Please check it in the Supabase console.',
    mistralQuotaExceeded:
      "⏱️ Quota exceeded: API usage limit reached. Please try again later or upgrade your Mistral plan.",
    tagsGenerationError: 'Error generating tags',
    enterBrainstormTopic: 'Please enter a brainstorming topic',
    brainstormError: 'Error during brainstorming',
    ideaPrefix: 'Idea: {idea}',
    aiIdeaHeading: '### AI Idea',
    selectAtLeastOneNote: 'Please select at least one note',
    synthesisError: 'Error during synthesis',
    multiNotesSynthesis: 'Multi-Notes Synthesis',
    linkDetectionError: 'Error detecting links',
    summaries: 'Summaries',
    tags: 'Tags',
    links: 'Links',
    ideas: 'Ideas',
    synthesis: 'Synthesis',
    summaryType: 'Summary type',
    shortSummary: 'Short summary',
    detailedSummary: 'Detailed summary',
    keyPoints: 'Key points',
    generateSummary: 'Generate a summary',
    summaryTitlePrefix: 'Summary - {title}',
    createNote: 'Create a note',
    recentHistory: 'Recent history',
    viewSummary: 'View summary: {title}',
    generateTags: 'Generate tags',
    suggestedTags: 'Suggested tags',
    applyTags: 'Apply tags',
    currentTags: 'Current tags',
    discoverSimilarNotes:
      'Discover similar notes and create connections automatically.',
    analyzing: 'Analyzing...',
    detectLinks: 'Detect links',
    suggestedLinkedNotes: 'Suggested linked notes',
    insertLink: 'Insert link [[{title}]]',
    noLinkSuggestions: 'No link suggestions yet.',
    noLinkSuggestionsHint: 'Click "Detect links" to analyze.',
    brainstormTopic: 'Brainstorming topic',
    enterTopicPlaceholder: 'Enter a topic...',
    generateIdeas: 'Generate ideas',
    generatedIdeas: 'Generated ideas',
    addToNote: 'Add to note',
    selectNotes: 'Select notes',
    synthesizeNotesCount: 'Summarize {count} note(s)',

    // AIContextMenu
    back: '← Back',
    formal: 'Formal',
    casual: 'Casual',
    professional: 'Professional',
    persuasive: 'Persuasive',
    english: 'English',
    spanish: 'Spanish',
    german: 'German',
    italian: 'Italian',
    continueText: 'Continue the text',
    improveStyle: 'Improve the style',
    changeTone: 'Change the tone',
    translate: 'Translate',
    insertAfter: 'Insert after',
    replace: 'Replace',
    unknownAction: 'Unknown action',
    aiProcessingError: 'Error during AI processing',

    // AISummaryModal
    aiServiceUnavailable: 'AI service unavailable',
    generationCancelled: 'Generation cancelled',
    generationCancelledByUser: 'Generation cancelled by the user.',
    unexpectedSummaryError:
      'An unexpected error occurred while generating the summary.',
    justNow: 'Just now',
    minutesAgo: '{count} min ago',
    hoursAgo: '{count}h ago',
    daysAgo: '{count}d ago',
    shortType: 'Short (2-3 sentences)',
    detailedType: 'Detailed (paragraph)',
    bulletsType: 'Key points (bullets)',
    replaceContent: 'Replace the content',
    prependContent: 'Add at the beginning',
    appendContent: 'Add at the end',
    aiAutoSummary: 'AI Auto Summary',
    history: 'History',
    generatingInProgress: 'Generating...',
    applyMode: 'Apply mode',
    generatedSummary: 'Generated summary',
    noSummariesInHistory: 'No summaries in history',
    summariesWillAppear: 'Generated summaries will appear here',
    use: 'Use',
    copySummary: 'Copy summary',
    copied: 'Copied!',
    copy: 'Copy',
    createNoteWithSummary: 'Create a new note with this summary',
    apply: 'Apply',
    regenerate: 'Regenerate',

    // AISettingsSection
    aiAssistantMistral: 'AI Assistant (Mistral)',
    checkingMistralConnection: 'Checking the Mistral API connection...',
    aiServiceOperational: 'AI service operational',
    aiServiceConnectedDesc:
      'The AI assistant is configured and connected. All features are available.',
    aiServiceTemporarilyUnavailable: 'AI service temporarily unavailable',
    retryConnection: 'Retry connection',
    cachedResponses: 'Cached responses',
    summaryHistory: 'Summary history',
    clearCache: 'Clear cache',
    clearHistory: 'Clear history',
    cacheInfo: 'Responses are cached for 24h to improve performance',
    availableAIFeatures: 'Available AI features:',
    featureAutoSummaries: 'Automatic summaries (short, detailed, bullets)',
    featureSummaryHistory: 'Summary history with reuse',
    featureAutoSuggest: 'Auto-suggestion for long notes (>500 characters)',
    featureTagGeneration: 'Smart tag generation',
    featureWritingAssistance: 'Writing assistance (continue, improve, translate)',
    featureBrainstorming: 'Brainstorming and idea generation',
    privacy: 'Privacy:',
    privacyNote:
      'Your notes are sent to Mistral AI only when using AI features. They are not stored by Mistral and are processed confidentially.',
    mistralKeyInvalidUnavailable:
      'The Mistral API key is invalid or expired. The AI service is temporarily unavailable.',
    cannotReachMistral:
      'Unable to reach the Mistral API. Check your internet connection.',
    aiServiceUnavailableWithError: 'AI service unavailable: {error}',
    aiServiceConfigProblem: 'The AI service has a configuration problem.',

    // Services
    mistralKeyNotConfigured:
      'Mistral API key not configured. Please configure the key in the settings.',
    mistralKeyInvalidOrExpired:
      'Mistral API key invalid or expired. Please check your configuration or contact support.',
    apiQuotaExceeded:
      'API quota exceeded. Please try again later or upgrade your Mistral plan.',
    mistralServerUnavailable:
      'Mistral server temporarily unavailable. Please try again in a few moments.',
    invalidRequest: 'Invalid request: {message}',
    incorrectParameters: 'Incorrect parameters',
    apiErrorCode: 'API error (code {code})',
    commonKeywords: 'Common keywords: {keywords}',

    // MarkdownPreview
    loadingVoiceMemo: 'Loading voice memo...',
    mermaidRenderError: 'Diagram rendering error: {error}',

    // Audio widget
    audioNotFound: 'Audio not found',
    audioLoadError: 'Loading error',

    // VoiceRecorder
    speechNotSupported:
      'Speech recognition is not supported. Please use Chrome, Edge or Safari and allow the microphone.',
    speakIntoMic: 'Speak into the microphone...',
    stop: 'Stop',
    transcription: 'Transcription',
    pause: 'Pause',
    play: 'Play',
    playback: 'Play',
    saveMemo: 'Save memo',
    noAudioRecorded:
      'Error: No audio recorded. Check that your microphone is working.',
    micAccessError: 'Unable to access the microphone. Check the permissions.',

    // InstallPrompt
    installJemanote: 'Install Jemanote',
    installDesc:
      'Install the app for quick access and an optimal experience, even offline.',
    install: 'Install',
    later: 'Later',

    // SubscriptionGuard
    subscriptionRequired:
      'This application requires a JemaOS Pro subscription.',
    upgradeToPro: 'Upgrade to Pro',
    reconnect: 'Sign in again',
    reconnecting: 'Reconnecting…',
    reconnectFailed: 'Reconnection failed. Try again in a moment.',
    guardLoading: 'Loading…',
    reconnectingInProgress: 'Reconnecting…',
    verifyingSession:
      'Verifying your JemaOS session. You will be redirected automatically.',
  },

  fr: {
    // Common UI
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    rename: 'Renommer',
    restore: 'Restaurer',
    untitled: 'Sans titre',
    untitledLowercase: 'sans titre',
    loading: 'Chargement...',
    generating: 'Génération...',
    processing: 'Traitement en cours...',
    search: 'Rechercher',
    searchTitle: 'Recherche',
    menu: 'Menu',
    language: 'Langue',
    newNote: 'Nouvelle note',
    noteTitleWithDate: 'Note {date}',
    noContent: 'Aucun contenu',
    note: 'Note',
    noteCount: '({count} note{suffix})',

    // Navigation
    mainNavigation: 'Navigation principale',
    hideSidebar: 'Masquer la barre latérale',
    showSidebar: 'Afficher la barre latérale',
    searchNotesPlaceholder: 'Rechercher des notes...',
    workspace: 'Espace de travail',
    canvas: 'Canvas',
    timeline: 'Chronologie',
    settings: 'Paramètres',
    hideInspector: "Masquer l'inspecteur",
    showInspector: "Afficher l'inspecteur",
    signOut: 'Se déconnecter',
    signIn: 'Se connecter',
    signInToSync: 'Se connecter pour synchroniser',
    login: 'Connexion',
    register: 'Inscription',
    closeMenu: 'Fermer le menu',

    // Sidebar
    restoreFolderAndNotes: 'Restaurer le dossier et ses notes',
    deletePermanently: 'Supprimer définitivement',
    exitSelectionMode: 'Quitter le mode sélection',
    selectionMode: 'Mode sélection',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    notes: 'Notes',
    deleteSelection: 'Supprimer la sélection',
    deleteWithCount: 'Supprimer ({count})',
    trash: 'Corbeille',
    trashEmpty: 'Corbeille vide',
    restoreSelection: 'Restaurer la sélection',
    restoreWithCount: 'Restaurer ({count})',
    emptyTrash: 'Vider la corbeille',
    emptyAll: 'Vider tout',
    folderNamePlaceholder: 'Nom du dossier...',
    newFolder: 'Nouveau dossier',
    folders: 'Dossiers',
    deleteSelectedFolders: 'Supprimer les dossiers sélectionnés',
    folderAriaLabel: 'Dossier {name}',
    createNoteInFolder: 'Créer une note dans ce dossier',
    renameFolder: 'Renommer le dossier',
    deleteFolder: 'Supprimer le dossier',
    unfiledNotes: 'Notes sans dossier',
    unfiled: 'Sans dossier',
    createUnfiledNote: 'Créer une note sans dossier',
    noNotes: 'Aucune note.',
    createNoteToStart: 'Créez-en une pour commencer.',
    metadata: 'Métadonnées',
    noteIdLabel: 'ID de la note',
    selectNoteForDetails: 'Sélectionnez une note pour voir les détails',
    deleteFolderConfirmWithNotes:
      'Supprimer ce dossier ? Les {count} note(s) seront déplacées vers la corbeille.',
    deleteFolderConfirmEmpty: 'Supprimer ce dossier vide ?',
    deleteFolderPermanentlyWithNotes:
      'Cette action est irréversible. Le dossier "{name}" et ses {count} note(s) seront supprimés définitivement.',
    deleteFolderPermanentlyConfirm:
      'Cette action est irréversible. Supprimer définitivement le dossier "{name}" ?',
    deleteSelectedFoldersConfirmWithNotes:
      'Supprimer {count} dossier(s) sélectionné(s) ? Les {countNotes} note(s) seront déplacées vers la corbeille.',
    deleteSelectedEmptyFoldersConfirm:
      'Supprimer {count} dossier(s) vide(s) sélectionné(s) ?',
    deleteSelectedNotesConfirm: 'Supprimer {count} note(s) sélectionnée(s) ?',
    emptyTrashConfirm:
      'Cette action est irréversible. Supprimer définitivement {count} élément(s) de la corbeille ?',
    deleteSelectedItemsConfirm:
      'Cette action est irréversible. Supprimer définitivement {count} élément(s) sélectionné(s) ?',
    deleteNoteConfirm: 'Êtes-vous sûr de vouloir supprimer cette note ?',
    deletePermanentlyConfirm:
      'Cette action est irréversible. Supprimer définitivement ?',
    moveTo: 'Déplacer vers...',
    noteAriaLabel: 'Note: {title}',

    // StatusBar
    syncing: 'Synchronisation...',
    synced: 'Synchronisé',
    disconnected: 'Déconnecté',
    syncNow: 'Synchroniser maintenant',
    enable: 'Activer',
    signInToSyncStatus: 'Connectez-vous pour synchroniser vos notes',
    localModeClickToSync: 'Mode Local - Cliquez pour activer la synchronisation cloud',
    local: 'Local',
    lastModified: 'Dernière modification: {time}',
    developedBy: 'Développé par',
    footerLicense: '© 2025 • Open Source & sous licence AGPL',
    modeEdit: 'Mode: Édition',
    editShort: 'Édit',

    // WorkspaceView
    noNoteSelected: 'Aucune note sélectionnée',
    selectOrCreateNote:
      'Sélectionnez une note dans la barre latérale ou créez-en une nouvelle',
    noteIsLong: 'Votre note est assez longue !',
    generateSummaryWithAI: "Générez un résumé automatique avec l'IA.",
    generate: 'Générer',
    noteTitlePlaceholder: 'Titre de la note',
    recordVoiceNote: 'Enregistrer une note vocale avec transcription',
    generateAISummary: "Générer un résumé avec l'IA",
    summary: 'Résumé',
    openAIAssistant: "Ouvrir l'Assistant IA",
    aiAssistant: 'Assistant IA',
    editMode: 'Mode édition',
    splitMode: 'Mode split',
    previewMode: 'Mode prévisualisation',
    voiceMemo: 'Mémo vocal',
    voiceMemoSaveError: 'Erreur lors de la sauvegarde du mémo vocal',

    // SearchView
    resultsFound: '{count} résultat{suffix} trouvé{suffix}',
    searchAllNotesPlaceholder: 'Rechercher dans toutes vos notes...',
    modifiedOn: 'Modifié le {date}',
    noResultsFor: 'Aucun résultat trouvé pour "{query}"',
    startTypingToSearch: 'Commencez à taper pour rechercher dans vos notes',

    // SettingsView
    settingsTitle: 'Paramètres',
    appearance: 'Apparence',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    editor: 'Éditeur',
    lineNumbers: 'Numéros de ligne',
    autoSave: 'Sauvegarde automatique',
    vimMode: 'Mode Vim',
    keyboardShortcuts: 'Raccourcis clavier',
    openCommandPalette: 'Ouvrir la palette de commandes',
    createNewNote: 'Créer une nouvelle note',
    saveNoteShortcut: 'Sauvegarder la note',
    searchInNotes: 'Rechercher dans les notes',
    toggleThemeShortcut: 'Basculer le thème clair/sombre',
    boldText: 'Texte en gras',
    italicText: 'Texte en italique',
    undo: 'Annuler',
    redo: 'Rétablir',
    closeActivePanel: 'Fermer le panneau actif',
    escapeKey: 'Échap',
    cloudSync: 'Synchronisation Cloud',
    syncEnabledLabel: 'Synchronisation activée',
    syncInterval: 'Intervalle de synchronisation (secondes)',

    // TimelineView & DateFilter
    notesTimeline: 'Chronologie des notes',
    modified: 'Modifié',
    created: 'Créé',
    modifiedLabel: 'Modifié: {time}',
    createdLabel: 'Créé: {date}',
    noNotesForDate: 'Aucune note trouvée pour cette date.',
    noNotesInHistory: "Aucune note dans l'historique.",
    filterByDate: 'Filtrer par date',
    chooseDate: 'Choisir une date',
    clear: 'Effacer',

    // CanvasView
    deleteCanvasSelectionConfirm:
      'Voulez-vous supprimer {count} élément(s) du canvas et mettre les {noteCount} note(s) à la corbeille ?',
    deleteCanvasNoteConfirm:
      'Voulez-vous supprimer la note originale et la mettre à la corbeille ?',
    selectedCount: '{count} sélectionné(s)',
    clearSelection: 'Annuler la sélection',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    resetView: 'Réinitialiser la vue',
    multiSelectMode: 'Mode sélection multiple',
    addNote: 'Ajouter une note',
    nodeAriaLabel: 'Nœud {title}',
    drawingArea: 'Zone de dessin',
    emptyCanvas: 'Canvas vide',
    emptyCanvasHint: 'Cliquez sur le bouton + pour ajouter des éléments',
    emptyCanvasPanHint:
      'Glissez pour déplacer la vue, utilisez les contrôles pour zoomer',

    // CommandPalette
    closeCommandPalette: 'Fermer la palette de commandes',
    commandPalettePlaceholder: 'Rechercher des commandes ou des notes...',
    noResults: 'Aucun résultat trouvé',
    actions: 'Actions',
    switchToDarkMode: 'Basculer en mode sombre',
    switchToLightMode: 'Basculer en mode clair',
    views: 'Vues',
    active: 'Actif',

    // Auth
    signUp: "S'inscrire",
    cloudSyncDesc:
      'Connectez-vous pour synchroniser vos notes sur tous vos appareils',
    email: 'Email',
    emailPlaceholder: 'votre@email.com',
    password: 'Mot de passe',
    anErrorOccurred: 'Une erreur est survenue',
    localNotesSyncAfterLogin:
      'Vos notes locales seront automatiquement synchronisées après connexion',
    professionalNoteApp: 'Application de prise de notes professionnelle',
    authInvalidCredentials:
      'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.',
    authEmailNotConfirmed:
      "Votre email n'a pas été confirmé. Veuillez vérifier votre boîte de réception.",
    authUserNotFound: 'Aucun compte trouvé avec cet email.',
    authEmailAlreadyRegistered: 'Un compte existe déjà avec cet email.',
    authPasswordTooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
    authNetworkError:
      'Problème de connexion. Veuillez vérifier votre connexion internet.',
    authRateLimit: 'Trop de tentatives. Veuillez réessayer plus tard.',
    authInvalidEmail: "L'adresse email n'est pas valide.",
    authGenericError: 'Une erreur est survenue. Veuillez réessayer.',

    // AIPanel
    noNoteOrEmpty: 'Aucune note sélectionnée ou note vide',
    summaryGenerationError: 'Erreur lors de la génération du résumé',
    mistralNotConfigured:
      "⚠️ Configuration manquante : La clé API Mistral n'est pas configurée sur le serveur Supabase. Veuillez suivre les instructions de configuration dans la documentation.",
    mistralKeyInvalid:
      '🔑 Clé API invalide : La clé API Mistral configurée est invalide ou expirée. Veuillez la vérifier dans la console Supabase.',
    mistralQuotaExceeded:
      "⏱️ Quota dépassé : Limite d'utilisation API atteinte. Veuillez réessayer plus tard ou mettre à niveau votre plan Mistral.",
    tagsGenerationError: 'Erreur lors de la génération des tags',
    enterBrainstormTopic: 'Veuillez entrer un sujet de brainstorming',
    brainstormError: 'Erreur lors du brainstorming',
    ideaPrefix: 'Idée: {idea}',
    aiIdeaHeading: '### Idée IA',
    selectAtLeastOneNote: 'Veuillez sélectionner au moins une note',
    synthesisError: 'Erreur lors de la synthèse',
    multiNotesSynthesis: 'Synthèse Multi-Notes',
    linkDetectionError: 'Erreur lors de la détection de liens',
    summaries: 'Résumés',
    tags: 'Tags',
    links: 'Liens',
    ideas: 'Idées',
    synthesis: 'Synthèse',
    summaryType: 'Type de résumé',
    shortSummary: 'Résumé court',
    detailedSummary: 'Résumé détaillé',
    keyPoints: 'Points clés',
    generateSummary: 'Générer un résumé',
    summaryTitlePrefix: 'Résumé - {title}',
    createNote: 'Créer une note',
    recentHistory: 'Historique récent',
    viewSummary: 'Voir le résumé: {title}',
    generateTags: 'Générer des tags',
    suggestedTags: 'Tags suggérés',
    applyTags: 'Appliquer les tags',
    currentTags: 'Tags actuels',
    discoverSimilarNotes:
      'Découvrez des notes similaires et créez des connexions automatiquement.',
    analyzing: 'Analyse en cours...',
    detectLinks: 'Détecter les liens',
    suggestedLinkedNotes: 'Notes liées suggérées',
    insertLink: 'Insérer lien [[{title}]]',
    noLinkSuggestions: 'Aucune suggestion de lien pour le moment.',
    noLinkSuggestionsHint: 'Cliquez sur "Détecter les liens" pour analyser.',
    brainstormTopic: 'Sujet de brainstorming',
    enterTopicPlaceholder: 'Entrez un sujet...',
    generateIdeas: 'Générer des idées',
    generatedIdeas: 'Idées générées',
    addToNote: 'Ajouter à la note',
    selectNotes: 'Sélectionner les notes',
    synthesizeNotesCount: 'Synthétiser {count} note(s)',

    // AIContextMenu
    back: '← Retour',
    formal: 'Formel',
    casual: 'Décontracté',
    professional: 'Professionnel',
    persuasive: 'Persuasif',
    english: 'Anglais',
    spanish: 'Espagnol',
    german: 'Allemand',
    italian: 'Italien',
    continueText: 'Continuer le texte',
    improveStyle: 'Améliorer le style',
    changeTone: 'Changer le ton',
    translate: 'Traduire',
    insertAfter: 'Insérer après',
    replace: 'Remplacer',
    unknownAction: 'Action non reconnue',
    aiProcessingError: 'Erreur lors du traitement IA',

    // AISummaryModal
    aiServiceUnavailable: 'Service IA non disponible',
    generationCancelled: 'Génération annulée',
    generationCancelledByUser: "Génération annulée par l'utilisateur.",
    unexpectedSummaryError:
      "Une erreur inattendue s'est produite lors de la génération du résumé.",
    justNow: "À l'instant",
    minutesAgo: 'Il y a {count} min',
    hoursAgo: 'Il y a {count}h',
    daysAgo: 'Il y a {count}j',
    shortType: 'Court (2-3 phrases)',
    detailedType: 'Détaillé (paragraphe)',
    bulletsType: 'Points clés (bullets)',
    replaceContent: 'Remplacer le contenu',
    prependContent: 'Ajouter au début',
    appendContent: 'Ajouter à la fin',
    aiAutoSummary: 'Résumé Automatique IA',
    history: 'Historique',
    generatingInProgress: 'Génération en cours...',
    applyMode: "Mode d'application",
    generatedSummary: 'Résumé généré',
    noSummariesInHistory: "Aucun résumé dans l'historique",
    summariesWillAppear: 'Les résumés générés apparaîtront ici',
    use: 'Utiliser',
    copySummary: 'Copier le résumé',
    copied: 'Copié !',
    copy: 'Copier',
    createNoteWithSummary: 'Créer une nouvelle note avec ce résumé',
    apply: 'Appliquer',
    regenerate: 'Régénérer',

    // AISettingsSection
    aiAssistantMistral: 'Assistant IA (Mistral)',
    checkingMistralConnection: "Vérification de la connexion à l'API Mistral...",
    aiServiceOperational: 'Service IA opérationnel',
    aiServiceConnectedDesc:
      "L'assistant IA est configuré et connecté. Toutes les fonctionnalités sont disponibles.",
    aiServiceTemporarilyUnavailable: 'Service IA temporairement indisponible',
    retryConnection: 'Réessayer la connexion',
    cachedResponses: 'Réponses en cache',
    summaryHistory: 'Historique des résumés',
    clearCache: 'Vider le cache',
    clearHistory: "Vider l'historique",
    cacheInfo:
      'Les réponses sont mises en cache 24h pour améliorer les performances',
    availableAIFeatures: 'Fonctionnalités IA disponibles:',
    featureAutoSummaries: 'Résumés automatiques (court, détaillé, bullets)',
    featureSummaryHistory: 'Historique des résumés avec réutilisation',
    featureAutoSuggest: 'Auto-suggestion pour notes longues (>500 caractères)',
    featureTagGeneration: 'Génération de tags intelligents',
    featureWritingAssistance: 'Rédaction assistée (continuer, améliorer, traduire)',
    featureBrainstorming: "Brainstorming et génération d'idées",
    privacy: 'Confidentialité:',
    privacyNote:
      "Vos notes sont envoyées à Mistral AI uniquement lors de l'utilisation des fonctionnalités IA. Elles ne sont pas stockées par Mistral et sont traitées de manière confidentielle.",
    mistralKeyInvalidUnavailable:
      'La clé API Mistral est invalide ou expirée. Le service IA est temporairement indisponible.',
    cannotReachMistral:
      "Impossible de contacter l'API Mistral. Vérifiez votre connexion internet.",
    aiServiceUnavailableWithError: 'Service IA indisponible : {error}',
    aiServiceConfigProblem:
      'Le service IA rencontre un problème de configuration.',

    // Services
    mistralKeyNotConfigured:
      'Clé API Mistral non configurée. Veuillez configurer la clé dans les paramètres.',
    mistralKeyInvalidOrExpired:
      'Clé API Mistral invalide ou expirée. Veuillez vérifier votre configuration ou contacter le support.',
    apiQuotaExceeded:
      'Quota API dépassé. Veuillez réessayer plus tard ou mettre à niveau votre plan Mistral.',
    mistralServerUnavailable:
      'Serveur Mistral temporairement indisponible. Veuillez réessayer dans quelques instants.',
    invalidRequest: 'Requête invalide: {message}',
    incorrectParameters: 'Paramètres incorrects',
    apiErrorCode: 'Erreur API (code {code})',
    commonKeywords: 'Mots-clés communs: {keywords}',

    // MarkdownPreview
    loadingVoiceMemo: 'Chargement du mémo vocal...',
    mermaidRenderError: 'Erreur de rendu du diagramme: {error}',
    audioNotFound: 'Audio introuvable',
    audioLoadError: 'Erreur chargement',

    // VoiceRecorder
    speechNotSupported:
      "La reconnaissance vocale n'est pas supportée. Veuillez utiliser Chrome, Edge ou Safari et autoriser le microphone.",
    speakIntoMic: 'Parlez dans le micro...',
    stop: 'Arrêter',
    transcription: 'Transcription',
    pause: 'Pause',
    play: 'Lire',
    playback: 'Lecture',
    saveMemo: 'Enregistrer le mémo',
    noAudioRecorded:
      'Erreur: Aucun audio enregistré. Vérifiez que votre microphone fonctionne.',
    micAccessError:
      "Impossible d'accéder au microphone. Vérifiez les permissions.",

    // InstallPrompt
    installJemanote: 'Installer Jemanote',
    installDesc:
      "Installez l'application pour un accès rapide et une expérience optimale, même hors ligne.",
    install: 'Installer',
    later: 'Plus tard',

    // SubscriptionGuard
    subscriptionRequired:
      'Cette application nécessite un abonnement JemaOS Pro.',
    upgradeToPro: 'Passer à Pro',
    reconnect: 'Se reconnecter',
    reconnecting: 'Reconnexion…',
    reconnectFailed: 'La reconnexion a échoué. Réessayez dans un instant.',
    guardLoading: 'Chargement…',
    reconnectingInProgress: 'Reconnexion en cours…',
    verifyingSession:
      'Vérification de votre session JemaOS. Vous allez être redirigé automatiquement.',
  },
};

// Detect system language (JemaOS: the system language always wins on load)
export function getSystemLang(): Lang {
  const nav = navigator as { language?: string; userLanguage?: string };
  const browserLang = nav.language ?? nav.userLanguage ?? 'fr';
  const short = browserLang.split('-')[0].toLowerCase();
  return short === 'fr' ? 'fr' : 'en';
}

// Module-level language used by non-React code (services, hooks outside providers).
// Kept in sync by the LanguageProvider on every language change.
let currentLang: Lang = getSystemLang();

export function setI18nLang(lang: Lang) {
  currentLang = lang;
}

export function getI18nLang(): Lang {
  return currentLang;
}

function formatTemplate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  );
}

export function lookupTranslation(lang: Lang, key: string): string | undefined {
  return (translations[lang] as Record<string, string | undefined>)[key];
}

// Translation function for non-React code (services, etc.)
export function translate(key: string, params?: TranslationParams): string {
  const value =
    lookupTranslation(currentLang, key) ?? lookupTranslation('en', key) ?? key;
  return formatTemplate(value, params);
}

// Locale helpers (date formatting follows the app language)
export function localeFor(lang: Lang): string {
  return lang === 'fr' ? 'fr-FR' : 'en-US';
}
