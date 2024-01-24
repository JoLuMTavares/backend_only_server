import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import MyParagraph from 'my-paragraph.js';
// import MyTune from 'my-tune.js';

const editor = EditorJS({
  /**
   * Id of Element that should contain the Editor
   */
  holder: 'editorjs',

  /**
   * Common Inline Toolbar settings
   * - if true (or not specified), the order from 'tool' property will be used (default)
   * - if an array of tool names, this order will be used
   */
  inlineToolbar: ['link', 'marker', 'bold', 'italic'],
  // inlineToolbar: true,

  /**
   * Available Tools list.
   * Pass Tool's class or Settings object for each Tool you want to use
   */
  tools: {
    header: {
      class: Header,
      /**
       * This property will override the common settings
       * That means that this tool will have only Marker and Link inline tools
       * If 'true', the common settings will be used.
       * If 'false' or omitted, the Inline Toolbar wont be shown
       */
      inlineToolbar: ['marker','link'],
    },
    list: {
      class: List,
      inlineToolbar: true,
    },
    myOwnParagraph: MyParagraph,
  },

  /**
   * Internationalzation config
   */
  i18n: {
    /**
     * @type {I18nDictionary}
     */
    messages: {
      /**
       * Other below: translation of different UI components of the editor.js core
       */
      ui: {
        blockTunes: {
          toggler: {
            'Click to tune': 'Clique para apanhar',
            'or drag to move': 'ou arraste para mover',
          },
        },
        inlineToolbar: {
          converter: {
            'Convert to': 'Converter para',
          },
        },
        toolbar: {
          toolbox: {
            Add: 'Adicionar',
          },
        },
      },

      /**
       * Section for translation Tool Names: both block and inline tools
       */
      toolNames: {
        Text: 'Texto',
        Heading: 'Cabeçalho',
        List: 'Lista',
        Warning: 'Aviso',
        Checklist: 'Lista de controlo',
        Quote: 'Citar',
        Code: 'Código',
        Delimiter: 'Delimitador',
        'Raw HTML': 'HTML puro',
        Table: 'Tabela',
        Link: 'Ligação',
        Marker: 'Marcador',
        Bold: 'Forte',
        Italic: 'Itálico',
        InlineCode: 'Código embutido',
      },

      /**
       * Section for passing translations to the external tools classes
       */
      tools: {
        /**
         * Each subsection is the i18n dictionary that will be passed to the corresponded plugin
         * The name of a plugin should be equal the name you specify in the 'tool' section for that plugin
         */
        warning: {
          // <-- 'Warning' tool will accept this dictionary section
          Title: 'Título',
          Message: 'Mensagem',
        },

        /**
         * Link is the internal Inline Tool
         */
        link: {
          'Add a link': 'Adicionar uma ligação',
        },
        /**
         * The "stub" is an internal block tool, used to fit blocks that does not have the corresponded plugin
         */
        stub: {
          'The block can not be displayed correctly.': 'O bloco não pode ser exibido corretamente.',
        },
      },

      /**
       * Section allows to translate Block Tunes
       */
      blockTunes: {
        /**
         * Each subsection is the i18n dictionary that will be passed to the corresponded Block Tune plugin
         * The name of a plugin should be equal the name you specify in the 'tunes' section for that plugin
         *
         * Also, there are few internal block tunes: "delete", "moveUp" and "moveDown"
         */
        delete: {
          Delete: 'Eliminar',
        },
        moveUp: {
          'Move up': 'Mover para cima',
        },
        moveDown: {
          'Move down': 'Mover para baixo',
        },
      },
    },
     /**
     * Text direction
     */
    //  direction: 'rtl',
  },

  /**
   * Previously saved data that should be rendered
   */
  data: {},

  /**
   * This Tool will be used as default
   */
  defaultBlock: 'myOwnParagraph',

  /**
   * onReady callback
   */
  onReady: () => {
    console.log('Editor.js is ready to work!');
  },

  /**
   * Enable autofocus
   */
  autofocus: true,

  /**
   * Some text to highlight that the user should
   * write something.
   */
  placeholder: 'Let`s write an awesome story!',

  /**
   * logLevel implemented as "INFO". It will show all
   * the messages and debug messages on the console.
   * Other options are : "VERBOSE" for all the messages,
   * "WARN" for only warning messages and "ERROR" for
   * only error messages.
   */
  logLevel: 'INFO',

  /**
   * onChange callback
   */
  onChange: (api, event) => {
    console.log("Now I know that Editor's content changed!", event);
  },
});

/**
 * After the editor is ready, it has the "isReady" property.
 * It is as a promise promise object. By using async/await, we
 * check if this promise can be called or not. If the editor
 * isn't initialized yet, an error will be catched.
 */
try {
  await editor.isReady;
  console.log('Editor.js is ready to work!');
  /** Do anything you need after editor initialization */
} catch (reason) {
  console.log(`Editor.js initialization failed because of ${reason}`);
}

/**
 * Method to save data. It will return a Promise 
 * that resolves with clean data.
 */
editor.save().then((outputData) => {
  console.log('Article data: ', outputData)
}).catch((error) => {
  console.log('Saving failed: ', error)
});