$(function(){
  try {
    const hasApp = !!window.App;
    const hasInit = hasApp && typeof window.App.init === 'function';
    
    if (!hasApp || !hasInit) {
      console.error('[Contract] Missing App.init');
      return;
    }
    
    // Initialize the application
    window.App.init();
    
  } catch (e) {
    console.error('Initialization failed', e);
  }
});