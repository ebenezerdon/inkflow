window.App = window.App || {};

(function() {
  // Default State
  const DEFAULT_STATE = {
    paperSize: 'A4',
    orientation: 'portrait',
    guideSize: 14, // mm line height
    fontFamily: 'Raleway Dots',
    fontColor: '#000000',
    guideColor: '#9ca3af',
    text: 'The quick brown fox jumps over the lazy dog.',
    mode: 'custom', // custom, sentences, alphabet
    showGuides: true,
    textScale: 0.8,
    baselineOffset: 2 // mm offset to push text down to baseline
  };

  let state = { ...DEFAULT_STATE };

  // DOM Elements Cache
  let $previewContainer, $sheet, $controls;

  function init() {
    $previewContainer = $('#preview-container');
    $sheet = $('#sheet-paper');
    $controls = $('#controls');

    loadState();
    bindEvents();
    renderSheet();
    checkAI();
  }

  function checkAI() {
     // Auto-load AI if not ready, but don't block UI
     if (window.AppLLM && !window.AppLLM.ready) {
        // Show a small indicator or toast if needed, but we'll wait for user to click "Generate"
        // to trigger the heavy load visualization, or load silently if cached.
        // Actually, let's just expose the load function to the UI button.
     }
  }

  function loadState() {
    const saved = localStorage.getItem('inkflow_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...DEFAULT_STATE, ...parsed };
      } catch (e) { console.error('State load error', e); }
    }

    // Populate inputs
    $('#input-text').val(state.text);
    $('#setting-size').val(state.guideSize);
    $('#setting-font').val(state.fontFamily);
    $('#setting-scale').val(state.textScale);
    $('#setting-baseline').val(state.baselineOffset);
    $('#setting-color-text').val(state.fontColor);
    $('#setting-color-guide').val(state.guideColor);
    // Set active mode button
    $(`.mode-btn[data-mode="${state.mode}"]`).addClass('ring-2 ring-amber-500 bg-amber-50');
  }

  function saveState() {
    localStorage.setItem('inkflow_state', JSON.stringify(state));
  }

  function bindEvents() {
    // Text Input
    $('#input-text').on('input', window.App.Helpers.debounce(function() {
      state.text = $(this).val();
      renderSheet();
      saveState();
    }, 300));

    // Settings Inputs
    $('#setting-size').on('input', function() {
      state.guideSize = $(this).val();
      renderSheet();
      saveState();
    });

    $('#setting-font').on('change', function() {
      state.fontFamily = $(this).val();
      renderSheet();
      saveState();
    });

    $('#setting-color-text').on('input', function() {
      state.fontColor = $(this).val();
      renderSheet();
      saveState();
    });

    $('#setting-color-guide').on('input', function() {
      state.guideColor = $(this).val();
      renderSheet();
      saveState();
    });

    // Fine Tuning
    $('#setting-scale').on('input', function() {
      state.textScale = $(this).val();
      renderSheet();
      saveState();
    });

    $('#setting-baseline').on('input', function() {
      state.baselineOffset = $(this).val();
      renderSheet();
      saveState();
    });

    // Print
    $('#btn-print').on('click', function() {
       window.App.Helpers.printSheet();
    });

    // AI Generation
    $('#btn-generate-ai').on('click', async function() {
       const topic = $('#ai-topic').val() || 'fun facts';
       await generateContent(topic);
    });
    $('#ai-topic').on('keypress', function(e) {
       if (e.which === 13) {
          e.preventDefault();
          $('#btn-generate-ai').click();
       }
    });
    
    // Mode Switching
    $('.mode-btn').on('click', function() {
        $('.mode-btn').removeClass('ring-2 ring-amber-500 bg-amber-50').addClass('bg-white');
        $(this).addClass('ring-2 ring-amber-500 bg-amber-50').removeClass('bg-white');
        state.mode = $(this).data('mode');
        
        if(state.mode === 'alphabet') {
           state.text = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z\na b c d e f g h i j k l m n o p q r s t u v w x y z';
           $('#input-text').val(state.text);
           renderSheet();
        }
        saveState();
    });
  }

  async function generateContent(topic) {
     const $btn = $('#btn-generate-ai');
     const $output = $('#input-text');
     const $progress = $('#ai-progress');
     const $bar = $('#ai-progress-bar');
     const $status = $('#ai-status-text');

     try {
        $btn.prop('disabled', true).addClass('opacity-50 cursor-wait');
        $progress.removeClass('hidden');
        
        if (!window.AppLLM.ready) {
             $status.text('Loading AI Model (One-time)...');
             await window.AppLLM.load(null, (pct) => {
                 $bar.css('width', pct + '%');
                 $status.text('Loading Model (' + pct + '%)...');
             });
        }

        $status.text('Thinking...');
        $bar.css('width', '100%');
        
        const prompt = `Generate 5 simple, clear sentences about "${topic}" suitable for handwriting practice. Do not use numbering or bullets. Just the sentences.`;
        
        let generatedText = '';
        await window.AppLLM.generate(prompt, {
            system: 'You are a helpful teacher.',
            onToken: (token) => {
                generatedText += token;
                // live update input for effect
                $output.val(generatedText);
                // auto-resize or scroll could go here
            }
        });

        state.text = generatedText;
        renderSheet();
        saveState();
        
     } catch(err) {
        console.error(err);
        alert('AI Error: ' + err.message);
     } finally {
        $btn.prop('disabled', false).removeClass('opacity-50 cursor-wait');
        $progress.addClass('hidden');
        $status.text('');
     }
  }

  /**
   * Core Rendering Logic
   * We render DOM elements for lines and text to ensure perfect print quality via CSS.
   */
  function renderSheet() {
    $sheet.empty();

    // Metrics
    const lineHeightMm = parseInt(state.guideSize);
    const fontSize = lineHeightMm * (parseFloat(state.textScale) || 0.75);
    const pageHeightMm = 297;
    const rowsPerPage = Math.floor(pageHeightMm / lineHeightMm);
    
    // 1. Guides Layer
    const $guidesLayer = $('<div>').addClass('absolute inset-0 w-full h-full pointer-events-none');
    
    for (let i = 0; i < rowsPerPage; i++) {
       const $row = $('<div>').addClass('relative w-full border-b-0');
       $row.css('height', lineHeightMm + 'mm');
       
       const $topLine = $('<div>').addClass('absolute top-0 w-full border-t border-solid').css('border-color', state.guideColor);
       const $midLine = $('<div>').addClass('absolute top-1/2 w-full border-t border-dashed').css('border-color', state.guideColor);
       const $botLine = $('<div>').addClass('absolute bottom-0 w-full border-b border-solid').css('border-color', state.guideColor);
       
       $row.append($topLine, $midLine, $botLine);
       $guidesLayer.append($row);
    }
    // 2. Text Layer (Overlay)
    // We use a single overlay to handle text wrapping automatically and ensuring visibility
    const $textLayer = $('<div>').addClass('absolute inset-0 z-10 w-full h-full whitespace-pre-wrap break-words overflow-hidden');
    $textLayer.css({
        'font-family': `"${state.fontFamily}", monospace`,
        'font-size': `${fontSize}mm`,
        'line-height': `${lineHeightMm}mm`,
        'color': state.fontColor,
        'padding-left': '10mm',
        'padding-right': '10mm',
        'padding-top': '1mm', // Slight adjustment to sit nicely on the baseline
        'transform': `translateY(${state.baselineOffset || 0}mm)`
    });
    $textLayer.text(state.text || '');
    
    $sheet.append($guidesLayer, $textLayer);
  }

  window.App.init = init;
  window.App.render = renderSheet;
})();