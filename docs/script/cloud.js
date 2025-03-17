import { logger } from "firebase-functions";
import { firestore } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";

initializeApp();

exports.updateTopAlbums = firestore
  .document("albums/{albumId}/ratings/{userId}")
  .onWrite(async (change, context) => {
    // Fetch all albums and calculate averages (similar to your existing getTop100Albums logic)
    const albumsSnapshot = await firestore().collection("albums").get();
    
    const albumData = [];
    for (const albumDoc of albumsSnapshot.docs) {
      const ratingsSnapshot = await albumDoc.ref.collection("ratings").get();
      // ... existing score calculation logic ...
      albumData.push({ /* album data */ });
    }

    albumData.sort((a, b) => b.averageScore - a.averageScore);
    const top100 = albumData.slice(0, 100);

    // Update the cached collection
    const batch = firestore().batch();
    const topAlbumsRef = firestore().collection("topAlbums");
    
    // Clear existing data
    const oldSnapshot = await topAlbumsRef.get();
    oldSnapshot.forEach(doc => batch.delete(doc.ref));

    // Add new data
    top100.forEach((album, index) => {
      const docRef = topAlbumsRef.doc(index.toString());
      batch.set(docRef, { ...album, rank: index + 1 });
    });

    await batch.commit();
    logger.log("Top albums updated successfully");
  });