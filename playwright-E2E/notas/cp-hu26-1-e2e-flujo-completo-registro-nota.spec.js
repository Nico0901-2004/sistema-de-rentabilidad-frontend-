const { test } = require('../fixtures/e2eTest');
const { storageStatePath } = require('../helpers/authState');
const { getNoteRegistrationData } = require('../helpers/testDataFactory');
const { deactivateCreatedNote } = require('../helpers/businessDataGuards');
const { NotasPage } = require('../page-objects/NotasPage');

test.describe.serial('CP-HU26-1-E2E - Flujo completo registro nota', () => {
  test.use({ storageState: storageStatePath('lider') });

  test('permite registrar una nota y verla en el proyecto', async ({ page }, testInfo) => {
    const notasPage = new NotasPage(page);
    const noteData = getNoteRegistrationData(testInfo);
    let createdNote;

    try {
      await page.goto('/panel-lider');
      await notasPage.gotoFromSidebar();

      createdNote = await notasPage.createNote(noteData);
      await notasPage.expectNoteVisible(noteData);
    } finally {
      await deactivateCreatedNote(createdNote?.id_nota);
    }
  });
});
