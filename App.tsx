import React, { useState, useCallback, useMemo } from 'react';
import { SpeechType, Character, ScriptLine, PromptRequest, GeneratedPrompt } from './types';
import { generatePrompt, generateScenarioSuggestion, generateNarratorDetailsSuggestion, generateImageTouchSuggestion } from './services/geminiService';
import { Language, UI_TEXT } from './i18n';
import { PlusIcon, MinusIcon, CopyIcon, CheckIcon, SparklesIcon, RefreshIcon, LanguageIcon } from './components/icons';

// A new, more intuitive component for AI-powered scenario generation.
const AIScenarioGenerator: React.FC<{
    theme: string;
    onThemeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    scenario: string;
    onScenarioChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    t: { scenarioTheme: string; scenarioThemePlaceholder: string; scenarioPlaceholder: string; };
}> = ({ theme, onThemeChange, onGenerate, isGenerating, scenario, onScenarioChange, t }) => (
    <div className="space-y-4">
        <div>
            <label htmlFor="scenario-theme" className="block text-sm font-medium text-gray-400 mb-1">{t.scenarioTheme}</label>
            <div className="flex items-start space-x-2">
                <textarea
                    id="scenario-theme"
                    value={theme}
                    onChange={onThemeChange}
                    placeholder={t.scenarioThemePlaceholder}
                    rows={2}
                    className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition"
                />
                <button
                    onClick={onGenerate}
                    disabled={isGenerating || !theme}
                    className="flex-shrink-0 p-2 rounded-lg bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    aria-label="Generate scenario from theme"
                >
                    {isGenerating ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
        <textarea
            value={scenario}
            onChange={onScenarioChange}
            rows={6}
            className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition"
            placeholder={t.scenarioPlaceholder}
        ></textarea>
    </div>
);

const StructuredOutputViewer: React.FC<{ prompts: GeneratedPrompt[], T: typeof UI_TEXT['en'] }> = ({ prompts, T }) => {
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
    };

    if (!prompts || prompts.length === 0) return null;

    const fullIntegratedText = useMemo(() => prompts.map(p => p.integrated).join('\n\n'), [prompts]);
    const fullIntegratedId = 'full-integrated-text';

    return (
        <div className="space-y-6">
            {/* Full Script View */}
            <div>
                <h3 className="font-semibold text-sm text-gray-400 select-none mb-2 px-1">{T.fullScript}</h3>
                <div className="relative group bg-black/30 p-4 rounded-lg ring-1 ring-gray-700/50">
                    <button
                        onClick={() => handleCopy(fullIntegratedText, fullIntegratedId)}
                        aria-label={T.copyPrompt}
                        className="p-1.5 bg-gray-700/80 rounded-md hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-2 right-2"
                    >
                        {copiedStates[fullIntegratedId] ? <CheckIcon className="text-green-400 w-4 h-4" /> : <CopyIcon className="text-gray-300 w-4 h-4"/>}
                    </button>
                    <pre className="text-teal-100 overflow-x-auto text-sm whitespace-pre-wrap font-mono">
                        {fullIntegratedText}
                    </pre>
                </div>
            </div>
            
            {/* Section-by-Section View */}
            {prompts.length > 1 && (
                <div>
                    <h3 className="font-semibold text-sm text-gray-400 select-none mb-2 px-1">{T.narrationSections}</h3>
                    <div className="space-y-3">
                        {prompts.map((prompt, index) => {
                            const sectionId = `section-integrated-${index}`;
                            return (
                                <div key={sectionId} className="relative group bg-black/30 p-4 rounded-lg ring-1 ring-gray-700/50">
                                    <button
                                        onClick={() => handleCopy(prompt.integrated, sectionId)}
                                        aria-label={`${T.copySection} ${index + 1}`}
                                        className="p-1.5 bg-gray-700/80 rounded-md hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-2 right-2"
                                    >
                                        {copiedStates[sectionId] ? <CheckIcon className="text-green-400 w-4 h-4" /> : <CopyIcon className="text-gray-300 w-4 h-4"/>}
                                    </button>
                                    <pre className="text-teal-100 overflow-x-auto text-sm whitespace-pre-wrap font-mono">
                                        {prompt.integrated}
                                    </pre>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


const StructuredJsonViewer: React.FC<{ prompts: GeneratedPrompt[]; T: typeof UI_TEXT['en'] }> = ({ prompts, T }) => {
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
    };

    if (!prompts || prompts.length === 0) return null;

    const fullJsonArrayText = useMemo(() => JSON.stringify(prompts.map(p => p.json), null, 2), [prompts]);
    const fullJsonId = 'json-full-array';

    return (
        <div className="space-y-4 mt-2 p-2">
            {/* Full JSON Array View */}
            <div className="relative group bg-black/30 p-3 rounded-lg ring-1 ring-gray-700/50">
                 <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-xs text-gray-400 select-none">{T.fullJsonArray}</h3>
                    <button 
                        onClick={() => handleCopy(fullJsonArrayText, fullJsonId)}
                        aria-label={T.copyJson}
                        className="p-1.5 bg-gray-700/80 rounded-md hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                        {copiedStates[fullJsonId] ? <CheckIcon className="text-green-400 w-4 h-4" /> : <CopyIcon className="text-gray-300 w-4 h-4"/>}
                    </button>
                 </div>
                 <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{fullJsonArrayText}</pre>
            </div>
            
            {/* Section-by-Section JSON Object View */}
            {prompts.length > 1 && (
                 <div className="space-y-2">
                     <h3 className="font-semibold text-xs text-gray-400 mt-3 mb-1 select-none pl-1">{T.jsonBySection}</h3>
                     {prompts.map((prompt, index) => {
                         const sectionId = `json-section-obj-${index}`;
                         const sectionJsonText = JSON.stringify(prompt.json, null, 2);
                         return (
                            <div key={sectionId} className="relative group bg-black/30 p-3 rounded-lg ring-1 ring-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-semibold text-xs text-gray-500 select-none">{T.jsonObjectForSection.replace('{num}', String(index + 1))}</h4>
                                    <button 
                                        onClick={() => handleCopy(sectionJsonText, sectionId)} 
                                        aria-label={`${T.copyJson} for Section ${index + 1}`}
                                        className="p-1.5 bg-gray-700/80 rounded-md hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                         {copiedStates[sectionId] ? <CheckIcon className="text-green-400 w-4 h-4" /> : <CopyIcon className="text-gray-300 w-4 h-4"/>}
                                    </button>
                                </div>
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{sectionJsonText}</pre>
                            </div>
                         );
                     })}
                </div>
            )}
        </div>
    );
};


const AppContent: React.FC<{ lang: Language; T: typeof UI_TEXT['en'] }> = ({ lang, T }) => {
    const [speechType, setSpeechType] = useState<SpeechType>(SpeechType.NARRATION);
    
    // State
    const [scenario, setScenario] = useState('');
    const [scenarioTheme, setScenarioTheme] = useState('');
    const [duration, setDuration] = useState('');
    const [numberOfSections, setNumberOfSections] = useState('');
    const [persona, setPersona] = useState('');
    const [emotion, setEmotion] = useState('');
    const [tone, setTone] = useState('');
    const [environment, setEnvironment] = useState('');
    const [characters, setCharacters] = useState<Character[]>([
        { id: `char-${crypto.randomUUID()}`, name: '', persona: '', imageTouch: '' },
        { id: `char-${crypto.randomUUID()}`, name: '', persona: '', imageTouch: '' },
    ]);
    const [script, setScript] = useState<ScriptLine[]>([
        { id: `line-${crypto.randomUUID()}`, characterId: '', line: '', emotion: '', tone: '' }
    ]);

    // UI State
    const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState< 'scenario' | 'details' | null>(null);
    const [suggestingImageTouch, setSuggestingImageTouch] = useState<string | null>(null);

    const handleAddCharacter = useCallback(() => setCharacters(prev => [...prev, { id: `char-${crypto.randomUUID()}`, name: '', persona: '', imageTouch: '' }]), []);
    const handleRemoveCharacter = useCallback((id: string) => {
        setCharacters(prev => prev.filter(c => c.id !== id));
        setScript(prev => prev.map(l => l.characterId === id ? { ...l, characterId: '' } : l));
    }, []);
    const handleCharacterChange = useCallback((id: string, field: keyof Omit<Character, 'id'>, value: string) => setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)), []);
    
    const handleAddScriptLine = useCallback(() => setScript(prev => [...prev, { id: `line-${crypto.randomUUID()}`, characterId: '', line: '', emotion: '', tone: '' }]), []);
    const handleRemoveScriptLine = useCallback((id: string) => setScript(prev => prev.filter(l => l.id !== id)), []);
    const handleScriptChange = useCallback((id: string, field: keyof Omit<ScriptLine, 'id'>, value: string) => setScript(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l)), []);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedPrompts(null);
        
        let request: PromptRequest;
        if (speechType === SpeechType.NARRATION) {
            request = { type: SpeechType.NARRATION, scenario, persona, emotion, tone, environment, duration, numberOfSections };
        } else {
             const finalCharacters = characters.filter(c => c.name.trim() !== '' && c.persona.trim() !== '');
             if (finalCharacters.length === 0) {
                 setError(T.errorCharacterNeeded);
                 setIsLoading(false);
                 return;
             }
            request = { type: speechType, scenario, characters: finalCharacters, script: script.filter(l => l.line.trim() !== '' && l.characterId), duration, numberOfSections };
        }

        try {
            const results = await generatePrompt(request);
            setGeneratedPrompts(results);
        } catch (e: any) {
            setError(e.message || T.errorUnexpected);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleScenarioSuggestion = async () => {
        if (!scenarioTheme) return;
        setIsSuggesting('scenario');
        setError(null);
        try {
            const suggestion = await generateScenarioSuggestion(scenarioTheme, lang);
            setScenario(suggestion);
        } catch (e: any) {
            setError(e.message || T.errorSuggestion);
        } finally {
            setIsSuggesting(null);
        }
    };
    
    const handleDetailsSuggestion = async () => {
        if (!scenario) { setError(T.errorScenarioNeeded); return; }
        setIsSuggesting('details');
        setError(null);
        try {
            const details = await generateNarratorDetailsSuggestion(scenario, lang);
            setPersona(details.persona);
            setEmotion(details.emotion);
            setTone(details.tone);
            setEnvironment(details.environment);
        } catch (e: any) {
            setError(e.message || T.errorSuggestion);
        } finally {
            setIsSuggesting(null);
        }
    };

    const handleImageTouchSuggestion = async (characterId: string) => {
        const character = characters.find(c => c.id === characterId);
        if (!character || !character.name.trim() || !character.persona.trim()) {
            setError(T.errorCharacterInfoNeeded);
            return;
        }
        setSuggestingImageTouch(characterId);
        setError(null);
        try {
            const suggestion = await generateImageTouchSuggestion(character.name, character.persona, lang);
            handleCharacterChange(characterId, 'imageTouch', suggestion);
        } catch (e: any) {
            setError(e.message || T.errorSuggestion);
        } finally {
            setSuggestingImageTouch(null);
        }
    };

    const prettyErrorMessage = useMemo(() => {
        if (!error) return null;

        const prefix = "Gemini API Error: ";
        if (error.startsWith(prefix)) {
            const jsonPart = error.substring(prefix.length);
            try {
                const parsed = JSON.parse(jsonPart);
                if (parsed?.error?.message) {
                    return `${T.geminiErrorPrefix}: ${parsed.error.message}`;
                }
            } catch (e) {
                // Not a valid JSON, return original message with translated prefix
                 return `${T.geminiErrorPrefix}: ${jsonPart}`;
            }
        }
        return error;
    }, [error, T.geminiErrorPrefix]);
    
    const renderNarrationForm = () => (
        <>
            <fieldset className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                <legend className="text-sm font-semibold text-gray-300 px-2">{T.scenarioSetup}</legend>
                <div className="space-y-4">
                    <AIScenarioGenerator 
                        theme={scenarioTheme} onThemeChange={e => setScenarioTheme(e.target.value)}
                        onGenerate={handleScenarioSuggestion} isGenerating={isSuggesting === 'scenario'}
                        scenario={scenario} onScenarioChange={e => setScenario(e.target.value)}
                        t={{ scenarioTheme: T.scenarioTheme, scenarioThemePlaceholder: T.scenarioThemePlaceholder, scenarioPlaceholder: T.scenarioPlaceholder }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-1">{T.targetDuration}</label>
                            <input
                                type="number"
                                id="duration"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                placeholder={T.targetDurationPlaceholder}
                                min="0"
                                className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition"
                            />
                        </div>
                         <div>
                            <label htmlFor="sections" className="block text-sm font-medium text-gray-400 mb-1">{T.numberOfSections}</label>
                            <input
                                type="number"
                                id="sections"
                                value={numberOfSections}
                                onChange={e => setNumberOfSections(e.target.value)}
                                placeholder={T.numberOfSectionsPlaceholder}
                                min="1"
                                className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition"
                            />
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                <legend className="text-sm font-semibold text-gray-300 px-2">{T.narratorInfo}</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="persona" className="block text-sm font-medium text-gray-400 mb-1">{T.personaLabel}</label>
                        <textarea id="persona" placeholder={T.personaPlaceholder} value={persona} onChange={e => setPersona(e.target.value)} rows={2} className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition" />
                    </div>
                    <div>
                        <label htmlFor="emotion" className="block text-sm font-medium text-gray-400 mb-1">{T.emotionLabel}</label>
                        <textarea id="emotion" placeholder={T.emotionPlaceholder} value={emotion} onChange={e => setEmotion(e.target.value)} rows={2} className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition" />
                    </div>
                     <div>
                        <label htmlFor="environment" className="block text-sm font-medium text-gray-400 mb-1">{T.environmentLabel}</label>
                        <textarea id="environment" placeholder={T.narratorEnvironmentPlaceholder} value={environment} onChange={e => setEnvironment(e.target.value)} rows={2} className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition" />
                    </div>
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-400 mb-1">{T.toneLabel}</label>
                        <textarea id="tone" placeholder={T.tonePlaceholder} value={tone} onChange={e => setTone(e.target.value)} rows={2} className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition" />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button 
                        onClick={handleDetailsSuggestion} 
                        disabled={isSuggesting === 'details' || !scenario} 
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSuggesting === 'details' ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        <span>{isSuggesting === 'details' ? T.suggesting : T.suggestion}</span>
                    </button>
                </div>
            </fieldset>
        </>
    );
    
    const renderDialogueForm = () => (
        <>
            <fieldset className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                <legend className="text-sm font-semibold text-gray-300 px-2">{T.scenarioSetup}</legend>
                <div className="space-y-4">
                    <AIScenarioGenerator 
                        theme={scenarioTheme} onThemeChange={e => setScenarioTheme(e.target.value)}
                        onGenerate={handleScenarioSuggestion} isGenerating={isSuggesting === 'scenario'}
                        scenario={scenario} onScenarioChange={e => setScenario(e.target.value)}
                        t={{ scenarioTheme: T.scenarioTheme, scenarioThemePlaceholder: T.scenarioThemePlaceholder, scenarioPlaceholder: T.scenarioPlaceholder }}
                    />
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-1">{T.targetDuration}</label>
                            <input
                                type="number"
                                id="duration"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                placeholder={T.targetDurationPlaceholder}
                                min="0"
                                className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition"
                            />
                        </div>
                         <div>
                            <label htmlFor="sections" className="block text-sm font-medium text-gray-400 mb-1">{T.numberOfSections}</label>
                            <input
                                type="number"
                                id="sections"
                                value={numberOfSections}
                                onChange={e => setNumberOfSections(e.target.value)}
                                placeholder={T.numberOfSectionsPlaceholder}
                                min="1"
                                className="block w-full rounded-lg border-gray-600 bg-gray-900 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm placeholder:text-gray-500 transition"
                            />
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                <legend className="text-sm font-semibold text-gray-300 px-2">{T.characterInfo}</legend>
                <div className="space-y-3">
                    {characters.map((char, index) => (
                        <div key={char.id} className="flex items-start space-x-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                            <span className="text-gray-400 pt-2 font-medium">{index + 1}.</span>
                            <div className="flex-grow space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="text" placeholder={T.characterName} value={char.name} onChange={e => handleCharacterChange(char.id, 'name', e.target.value)} className="block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition" />
                                    <textarea placeholder={T.characterPersona} value={char.persona} onChange={e => handleCharacterChange(char.id, 'persona', e.target.value)} rows={2} className="block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition" />
                                </div>
                                <div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleImageTouchSuggestion(char.id)}
                                            disabled={suggestingImageTouch === char.id || !char.name.trim() || !char.persona.trim()}
                                            className="flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium text-teal-300 bg-teal-900/50 hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            aria-label={T.imageTouchSuggestion}
                                        >
                                            {suggestingImageTouch === char.id ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                            <span>{T.imageTouchSuggestion}</span>
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder={T.imageTouchPlaceholder}
                                        value={char.imageTouch || ''}
                                        onChange={e => handleCharacterChange(char.id, 'imageTouch', e.target.value)}
                                        rows={3}
                                        className="mt-2 block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-gray-500 transition"
                                    />
                                </div>
                            </div>
                            <button onClick={() => handleRemoveCharacter(char.id)} className="text-gray-500 hover:text-red-500 pt-1.5 transition-colors"><MinusIcon className="w-6 h-6"/></button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddCharacter} className="mt-4 flex items-center space-x-1 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"><PlusIcon className="w-4 h-4" /><span>{T.addCharacter}</span></button>
            </fieldset>

            <fieldset className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                <legend className="text-sm font-semibold text-gray-300 px-2">{T.scriptEditor}</legend>
                <div className="space-y-3">
                    {script.map((line) => (
                         <div key={line.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 space-y-2">
                             <div className="flex items-center space-x-2">
                                <select value={line.characterId} onChange={e => handleScriptChange(line.id, 'characterId', e.target.value)} className="block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition">
                                    <option value="">{T.selectCharacter}</option>
                                    {characters.filter(c => c.name).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={() => handleRemoveScriptLine(line.id)} className="text-gray-500 hover:text-red-500 transition-colors"><MinusIcon className="w-5 h-5"/></button>
                             </div>
                             <textarea placeholder={T.linePlaceholder} value={line.line} onChange={e => handleScriptChange(line.id, 'line', e.target.value)} rows={3} className="block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"></textarea>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <textarea placeholder={T.emotionLinePlaceholder} value={line.emotion} onChange={e => handleScriptChange(line.id, 'emotion', e.target.value)} rows={1} className="block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition" />
                                <textarea placeholder={T.toneLinePlaceholder} value={line.tone} onChange={e => handleScriptChange(line.id, 'tone', e.target.value)} rows={1} className="block w-full rounded-lg border-gray-600 bg-gray-800 shadow-sm sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition" />
                             </div>
                         </div>
                    ))}
                </div>
                <button onClick={handleAddScriptLine} className="mt-4 flex items-center space-x-1 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"><PlusIcon className="w-4 h-4" /><span>{T.addScriptLine}</span></button>
            </fieldset>
        </>
    );

    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <fieldset className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                        <legend className="text-sm font-semibold text-gray-300 px-2">{T.mode}</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(Object.values(SpeechType)).map(type => (
                                <button key={type} onClick={() => setSpeechType(type)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${speechType === type ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}>
                                   {type === SpeechType.NARRATION ? T.narration : type === SpeechType.ONE_ON_ONE ? T.oneOnOne : T.multi}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {speechType === SpeechType.NARRATION ? renderNarrationForm() : renderDialogueForm()}

                    <div className="pt-2">
                        <button onClick={handleSubmit} disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                            {isLoading ? T.generating : T.generatePrompt}
                        </button>
                    </div>
                </div>

                <div className="lg:sticky lg:top-24 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-100">{T.generatedPrompt}</h2>
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl min-h-[300px]">
                        {isLoading && <div className="flex justify-center items-center h-full p-10"><RefreshIcon className="w-10 h-10 mx-auto animate-spin text-teal-500" /></div>}
                        {error && <div className="m-4 bg-red-900/50 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg" role="alert">{prettyErrorMessage}</div>}
                        {generatedPrompts && (
                            <div className="space-y-4 p-4">
                                <StructuredOutputViewer prompts={generatedPrompts} T={T} />
                                <details className="bg-black/20 p-2 rounded-lg border border-gray-700/50">
                                    <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-200 p-1 transition-colors">{T.viewJson}</summary>
                                    <StructuredJsonViewer prompts={generatedPrompts} T={T} />
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

const App: React.FC = () => {
    const [appKey, setAppKey] = useState(1);
    const [lang, setLang] = useState<Language>('ko');
    const T = useMemo(() => UI_TEXT[lang], [lang]);

    const handleRefresh = () => {
        setAppKey(prevKey => prevKey + 1);
    };

    const toggleLanguage = () => setLang(current => current === 'en' ? 'ko' : 'en');

    return (
        <div className="min-h-screen">
            <header className="bg-gray-950/70 backdrop-blur-md sticky top-0 z-20 border-b border-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-100">{T.title}</h1>
                    <div className="flex items-center space-x-2">
                         <button onClick={handleRefresh} className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors" aria-label="Refresh application">
                            <RefreshIcon className="w-5 h-5" />
                         </button>
                         <button onClick={toggleLanguage} className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
                            <LanguageIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">{lang === 'en' ? '한국어' : 'English'}</span>
                        </button>
                    </div>
                </div>
            </header>
            <AppContent key={appKey} lang={lang} T={T} />
        </div>
    );
};

export default App;