window.App = window.App || {};

(function() {
  window.App.Helpers = {
    /**
     * Debounce function to limit frequent calls
     */
    debounce: function(func, wait) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },

    /**
     * Generate a unique ID
     */
    generateId: function() {
      return 'id-' + Math.random().toString(36).substr(2, 16);
    },

    /**
     * Trigger browser print dialog with specific print styles activated
     */
    printSheet: function() {
      window.print();
    },

    /**
     * format text for tracing (e.g. adding spaces if needed, though CSS usually handles spacing)
     */
    formatPracticeText: function(text, mode) {
      if (mode === 'repeat-letter') {
        // If user enters 'a', repeat it: 'a a a a ...'
        const letter = text.trim().charAt(0) || 'A';
        return Array(50).fill(letter).join(' ');
      }
      return text;
    }
  };
})();