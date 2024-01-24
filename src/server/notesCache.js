/**
 * 
 * This works as support for the notes.
 * Everytime the user wants to access information about
 * the notes, this module is used. 
 * 
 * If there's the same information already here stored, 
 * it will be sent to the frontend. Otherwise the 
 * information will be retrieve on the database and also
 * be here stored, before being sent to the front end.
 * 
 * This will enable better performance of the application.
 * 
 * 
 */


    // This array keeps the list of stored notes from each specific user
    let notesList = [];

    // This keeps the information about a single note associated from 
    // each user
    let note = [];


    /**
     * 
     * This function inserts an array that contains the user id (from
     * a specific user) and the associated notes list, into the array 
     * of notes list.
     * 
     *  
     * 
     */ 
    // const insertNotesList = nListArray => notesList.push(nListArray);

    const insertNotesList = (objID, nListArray, c = getNotesList(objID)) => (c === undefined || c === null || c.length === 0) ? notesList.push(nListArray) : "";

    /**
     * 
     * This funtion insert an array that contains the user id (from
     * a specific user) and the associated note, into the array of
     * notes.
     * 
     * 
     * @param {*} noteArr 
     * @returns 
     */
    const insertNote = (userObjId, noteObjId, noteArr, c = getNote(userObjId, noteObjId) )=> (c === undefined || c === null || c.length === 0) ? note.push(noteArr) : "";


    /**
     * 
     * This function returns the list of notes associated to
     * the specific user. It filters the notes list array having
     * the object id condition.
     * 
     * @param {*} objID 
     * @returns array
     */
    const getNotesList = objID => notesList.filter((note) => note[0].note.user_id.equals(objID));

    /* const getNotesList = objID => {notesList.forEach((note) => {
        console.log(note[0].note.user_id.toString());
    }) } ; */


    /**
     * 
     * This function returns the associated note to the specific user.
     * It filters the notes array having the object id condition.
     * 
     * @param {*} noteObjId 
     * @returns array
     */
    const getNote = (userObjId, noteObjId) => note.filter((note) => note[0]._doc.user_id.equals(userObjId) && note[0]._doc._id.equals(noteObjId));


    /**
     * 
     * This function removes any note in the cache associated 
     * to a specific user (by the given user id).
     * 
     * @param {*} userObjId 
     * @returns 
     */
    const removeNoteByUserId = userObjId => note = note.filter((note) => !note[0]._doc.user_id.equals(userObjId));

    /**
     * 
     * This function removes a specific note, by its ID,
     * from the notes cache.
     * It filters the array, so the note, with the matching
     * ID, stays out.
     * 
     * @param {*} noteObjId 
     */
    const removeNote = noteObjId => note = note.filter((note) => !note[0]._doc._id.equals(noteObjId));


    /**
     * 
     * This function removes the list of notes associated to
     * a specific user. It filters the array, so the array
     * that cointains the notes and has the matching ID will
     * stay out.
     * 
     * 
     * @param {*} objID 
     * @returns 
     */
    const removeNotesList = objID => notesList = notesList.filter((note) => !note[0].note.user_id.equals(objID));

module.exports = {insertNotesList, insertNote, getNotesList, getNote, removeNotesList, removeNoteByUserId, removeNote};