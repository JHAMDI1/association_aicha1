-- Script de données de test pour Association Aicha
-- Exécuter après les migrations
-- Version corrigée avec schémas exacts

-- ============================================
-- UTILISATEURS (Admin + 2 Secrétaires)
-- ============================================

-- 2 Secrétaires (mot de passe: "secret123")
INSERT OR IGNORE INTO users (id, nom, prenom, email, password_hash, role) VALUES
('user-sec1', 'Bennani', 'Fatima', 'fatima.bennani@association.ma', '$argon2id$v=19$m=19456,t=2,p=1$vN8F0pzE2GqJ7xKPQl3bGg$jZJ5jF8L8yF9KqN5sT7L1Q', 'SECRETAIRE'),
('user-sec2', 'Alami', 'Khadija', 'khadija.alami@association.ma', '$argon2id$v=19$m=19456,t=2,p=1$vN8F0pzE2GqJ7xKPQl3bGg$jZJ5jF8L8yF9KqN5sT7L1Q', 'SECRETAIRE');

-- Permissions pour Secrétaire 1 (Fatima) - Accès élèves, paiements, messages
INSERT OR IGNORE INTO user_permissions (id, user_id, module, can_read, can_write, can_validate) VALUES
('perm-sec1-1', 'user-sec1', 'eleves', 1, 1, 0),
('perm-sec1-2', 'user-sec1', 'paiements', 1, 1, 0),
('perm-sec1-3', 'user-sec1', 'messages', 1, 1, 0),
('perm-sec1-4', 'user-sec1', 'classes', 1, 0, 0);

-- Permissions pour Secrétaire 2 (Khadija) - Accès dépenses, donneurs
INSERT OR IGNORE INTO user_permissions (id, user_id, module, can_read, can_write, can_validate) VALUES
('perm-sec2-1', 'user-sec2', 'depenses', 1, 1, 0),
('perm-sec2-2', 'user-sec2', 'donneurs', 1, 1, 0),
('perm-sec2-3', 'user-sec2', 'messages', 1, 1, 0),
('perm-sec2-4', 'user-sec2', 'eleves', 1, 0, 0);

-- ============================================
-- NIVEAUX SCOLAIRES
-- ============================================
INSERT OR IGNORE INTO niveaux (id, nom, ordre) VALUES
('niv-1', 'CP - Cours Préparatoire', 1),
('niv-2', 'CE1 - Cours Élémentaire 1', 2),
('niv-3', 'CE2 - Cours Élémentaire 2', 3),
('niv-4', 'CM1 - Cours Moyen 1', 4),
('niv-5', 'CM2 - Cours Moyen 2', 5),
('niv-6', '6ème Année', 6);

-- ============================================
-- ENSEIGNANTS
-- ============================================
INSERT OR IGNORE INTO enseignants (id, nom, prenom, specialite) VALUES
('ens-1', 'Tazi', 'Mohammed', 'Mathématiques'),
('ens-2', 'Zahra', 'Amina', 'Français'),
('ens-3', 'Idrissi', 'Hassan', 'Arabe'),
('ens-4', 'Lamrini', 'Souad', 'Sciences'),
('ens-5', 'Berrada', 'Youssef', 'Histoire-Géographie'),
('ens-6', 'Fassi', 'Nadia', 'Éducation Islamique');

-- ============================================
-- CLASSES
-- ============================================
INSERT OR IGNORE INTO classes (id, nom, niveau_id, enseignant_id, annee_scolaire) VALUES
('class-1', 'CP-A', 'niv-1', 'ens-2', '2024-2025'),
('class-2', 'CP-B', 'niv-1', 'ens-3', '2024-2025'),
('class-3', 'CE1-A', 'niv-2', 'ens-1', '2024-2025'),
('class-4', 'CE2-A', 'niv-3', 'ens-4', '2024-2025'),
('class-5', 'CM1-A', 'niv-4', 'ens-5', '2024-2025'),
('class-6', 'CM2-A', 'niv-5', 'ens-6', '2024-2025');

-- ============================================
-- ÉLÈVES (30 élèves répartis dans les classes)
-- ============================================

-- CP-A (5 élèves)
INSERT OR IGNORE INTO eleves (id, code_matricule, nom, prenom, date_naissance, sexe, adresse, tuteur_tel) VALUES
('elv-001', 'ELV2024001', 'Alaoui', 'Yassine', '2018-03-15', 'M', '12 Rue des Écoles, Casablanca', '0612345601'),
('elv-002', 'ELV2024002', 'Benjelloun', 'Salma', '2018-05-20', 'F', '45 Avenue Mohammed V, Rabat', '0612345602'),
('elv-003', 'ELV2024003', 'Chakir', 'Adam', '2018-01-10', 'M', '78 Rue Hassan II, Casablanca', '0612345603'),
('elv-004', 'ELV2024004', 'Drissi', 'Lina', '2018-07-22', 'F', '23 Boulevard Zerktouni, Casablanca', '0612345604'),
('elv-005', 'ELV2024005', 'El Fassi', 'Omar', '2018-09-05', 'M', '56 Rue Allal Ben Abdellah, Rabat', '0612345605'),
('elv-006', 'ELV2024006', 'Filali', 'Nour', '2018-02-14', 'F', '89 Avenue des FAR, Casablanca', '0612345606'),
('elv-007', 'ELV2024007', 'Ghazi', 'Mehdi', '2018-04-18', 'M', '34 Rue de la Liberté, Rabat', '0612345607'),
('elv-008', 'ELV2024008', 'Haddad', 'Yasmine', '2018-06-25', 'F', '67 Boulevard Bir Anzarane, Casablanca', '0612345608'),
('elv-009', 'ELV2024009', 'Idrissi', 'Karim', '2018-08-30', 'M', '12 Rue Ibn Khaldoun, Rabat', '0612345609'),
('elv-010', 'ELV2024010', 'Jaafari', 'Hiba', '2018-11-12', 'F', '45 Avenue Mers Sultan, Casablanca', '0612345610'),
('elv-011', 'ELV2024011', 'Kabbaj', 'Amine', '2017-01-08', 'M', '78 Rue Gandhi, Casablanca', '0612345611'),
('elv-012', 'ELV2024012', 'Lamrani', 'Sara', '2017-03-22', 'F', '23 Boulevard Abdelmoumen, Casablanca', '0612345612'),
('elv-013', 'ELV2024013', 'Mernissi', 'Hamza', '2017-05-14', 'M', '56 Avenue Hassan II, Rabat', '0612345613'),
('elv-014', 'ELV2024014', 'Naciri', 'Malak', '2017-07-19', 'F', '89 Rue Al Massira, Casablanca', '0612345614'),
('elv-015', 'ELV2024015', 'Ouazzani', 'Ilyas', '2017-09-27', 'M', '34 Boulevard Moulay Youssef, Rabat', '0612345615'),
('elv-016', 'ELV2024016', 'Rahmani', 'Meryem', '2016-02-11', 'F', '67 Rue Liberté, Casablanca', '0612345616'),
('elv-017', 'ELV2024017', 'Saadi', 'Youssef', '2016-04-15', 'M', '12 Avenue Lalla Yacout, Casablanca', '0612345617'),
('elv-018', 'ELV2024018', 'Tazi', 'Imane', '2016-06-20', 'F', '45 Rue Mohammed Diouri, Rabat', '0612345618'),
('elv-019', 'ELV2024019', 'Alami', 'Reda', '2016-08-24', 'M', '78 Boulevard Zaid Ouhmad, Casablanca', '0612345619'),
('elv-020', 'ELV2024020', 'Bennani', 'Zineb', '2016-10-30', 'F', '23 Avenue Annakhil, Rabat', '0612345620'),
('elv-021', 'ELV2024021', 'Chraibi', 'Othmane', '2015-01-05', 'M', '56 Rue Prince Héritier, Casablanca', '0612345621'),
('elv-022', 'ELV2024022', 'Douiri', 'Sophia', '2015-03-10', 'F', '89 Boulevard Ghandi, Casablanca', '0612345622'),
('elv-023', 'ELV2024023', 'El Alami', 'Bilal', '2015-05-18', 'M', '34 Avenue Mly Abdellah, Rabat', '0612345623'),
('elv-024', 'ELV2024024', 'Fassi Fihri', 'Rim', '2015-07-22', 'F', '67 Rue Patrice Lumumba, Casablanca', '0612345624'),
('elv-025', 'ELV2024025', 'Guessous', 'Anas', '2015-09-28', 'M', '12 Boulevard Massira, Rabat', '0612345625'),
('elv-026', 'ELV2024026', 'Hamidi', 'Leila', '2014-02-08', 'F', '45 Rue Al Qods, Casablanca', '0612345626'),
('elv-027', 'ELV2024027', 'Ibrahimi', 'Ayoub', '2014-04-12', 'M', '78 Avenue Mohammed VI, Rabat', '0612345627'),
('elv-028', 'ELV2024028', 'Jamal', 'Nisrine', '2014-06-17', 'F', '23 Boulevard Anfa, Casablanca', '0612345628'),
('elv-029', 'ELV2024029', 'Kadiri', 'Walid', '2014-08-21', 'M', '56 Rue Oued Ziz, Rabat', '0612345629'),
('elv-030', 'ELV2024030', 'Lahlou', 'Majda', '2014-11-25', 'F', '89 Avenue Al Amal, Casablanca', '0612345630');

-- ============================================
-- INSCRIPTIONS (Lien Élève <-> Classe)
-- ============================================
INSERT OR IGNORE INTO inscriptions (id, eleve_id, classe_id) VALUES
('insc-001', 'elv-001', 'class-1'), ('insc-002', 'elv-002', 'class-1'), ('insc-003', 'elv-003', 'class-1'),  ('insc-004', 'elv-004', 'class-1'), ('insc-005', 'elv-005', 'class-1'),
('insc-006', 'elv-006', 'class-2'), ('insc-007', 'elv-007', 'class-2'), ('insc-008', 'elv-008', 'class-2'), ('insc-009', 'elv-009', 'class-2'), ('insc-010', 'elv-010', 'class-2'),
('insc-011', 'elv-011', 'class-3'), ('insc-012', 'elv-012', 'class-3'), ('insc-013', 'elv-013', 'class-3'), ('insc-014', 'elv-014', 'class-3'), ('insc-015', 'elv-015', 'class-3'),
('insc-016', 'elv-016', 'class-4'), ('insc-017', 'elv-017', 'class-4'), ('insc-018', 'elv-018', 'class-4'), ('insc-019', 'elv-019', 'class-4'), ('insc-020', 'elv-020', 'class-4'),
('insc-021', 'elv-021', 'class-5'), ('insc-022', 'elv-022', 'class-5'), ('insc-023', 'elv-023', 'class-5'), ('insc-024', 'elv-024', 'class-5'), ('insc-025', 'elv-025', 'class-5'),
('insc-026', 'elv-026', 'class-6'), ('insc-027', 'elv-027', 'class-6'), ('insc-028', 'elv-028', 'class-6'), ('insc-029', 'elv-029', 'class-6'), ('insc-030', 'elv-030', 'class-6');

-- ============================================
-- PAIEMENTS (Reçus + Lignes de paiement)
-- ============================================

-- Reçu 1: elv-001 (Yassine) - 4 mois payés
INSERT OR IGNORE INTO recus (id, numero, type_paiement, montant_total, mode_paiement, eleve_id, user_id, etat) VALUES
('recu-001', 'REC-001', 'MENSUALITE', 400, 'ESPECES', 'elv-001', 'user-admin', 'VALIDE');
INSERT OR IGNORE INTO lignes_paiement (id, recu_id, eleve_id, mois, annee, montant) VALUES
('ligne-001-09', 'recu-001', 'elv-001', 9, 2024, 100), ('ligne-001-10', 'recu-001', 'elv-001', 10, 2024, 100),
('ligne-001-11', 'recu-001', 'elv-001', 11, 2024, 100), ('ligne-001-12', 'recu-001', 'elv-001', 12, 2024, 100);

-- Reçu 2: elv-002 (Salma) - 4 mois payés 
INSERT OR IGNORE INTO recus (id, numero, type_paiement, montant_total, mode_paiement, eleve_id, user_id, etat) VALUES
('recu-002', 'REC-002', 'MENSUALITE', 400, 'VIREMENT', 'elv-002', 'user-admin', 'VALIDE');
INSERT OR IGNORE INTO lignes_paiement (id, recu_id, eleve_id, mois, annee, montant) VALUES
('ligne-002-09', 'recu-002', 'elv-002', 9, 2024, 100), ('ligne-002-10', 'recu-002', 'elv-002', 10, 2024, 100),
('ligne-002-11', 'recu-002', 'elv-002', 11, 2024, 100), ('ligne-002-12', 'recu-002', 'elv-002', 12, 2024, 100);

-- Reçu 3: elv-010 (Hiba) - 1 mois (retard 3 mois)
INSERT OR IGNORE INTO recus (id, numero, type_paiement, montant_total, mode_paiement, eleve_id, user_id, etat) VALUES
('recu-010', 'REC-010', 'MENSUALITE', 100, 'ESPECES', 'elv-010', 'user-admin', 'VALIDE');
INSERT OR IGNORE INTO lignes_paiement (id, recu_id, eleve_id, mois, annee, montant) VALUES
('ligne-010-09', 'recu-010', 'elv-010', 9, 2024, 100);

-- Reçu 4: elv-015 (Ilyas) - 2 mois (retard 2 mois)
INSERT OR IGNORE INTO recus (id, numero, type_paiement, montant_total, mode_paiement, eleve_id, user_id, etat) VALUES
('recu-015', 'REC-015', 'MENSUALITE', 200, 'CHEQUE', 'elv-015', 'user-admin', 'VALIDE');
INSERT OR IGNORE INTO lignes_paiement (id, recu_id, eleve_id, mois, annee, montant) VALUES
('ligne-015-09', 'recu-015', 'elv-015', 9, 2024, 100), ('ligne-015-10', 'recu-015', 'elv-015', 10, 2024, 100);

-- ============================================
-- DÉPENSES
-- ============================================
INSERT OR IGNORE INTO depenses (id, numero, beneficiaire, motif, montant, type_depense, etat, cree_par) VALUES
('dep-001', 'DEP-001', 'Librairie Nationale', 'Fournitures scolaires - Septembre', 5000, 'FACTURE', 'VALIDE', 'user-admin'),
('dep-002', 'DEP-002', 'Mohammed Tazi', 'Salaire enseignant', 4500, 'AUTRE', 'VALIDE', 'user-admin'),
('dep-003', 'DEP-003', 'Menuiserie Atlas', 'Réparation tableau classe CE1', 800, 'FACTURE', 'VALIDE', 'user-admin'),
('dep-004', 'DEP-004', 'Éditions Marocaines', 'Livres pédagogiques', 3200, 'FACTURE', 'EN_ATTENTE', 'user-sec2'),
('dep-005', 'DEP-005', 'Service Clean', 'Nettoyage locaux - Octobre', 1500, 'FACTURE', 'VALIDE', 'user-admin'),
('dep-006', 'DEP-006', 'Tech Store', 'Matériel informatique', 6000, 'FACTURE', 'EN_ATTENTE', 'user-sec2');

-- ============================================
-- DONNEURS & DONS
-- ============================================
INSERT OR IGNORE INTO donneurs (id, nom, prenom, telephone, email, adresse, commentaire, created_at) VALUES
('don-001', 'El Mansouri', 'Ahmed', '0661234567', 'ahmed.mansouri@email.ma', '15 Rue des Fleurs, Casablanca', 'Donateur régulier', '2024-09-01 10:00:00'),
('don-002', 'Foundation Al Amal', '', '0522334455', 'contact@alamal.org', '88 Boulevard Mohammed V, Rabat', 'Partenaire principal', '2024-09-01 10:00:00'),
('don-003', 'Benjelloun', 'Fatima', '0667891234', 'f.benjelloun@gmail.com', '45 Avenue Anfa, Casablanca', 'Dons annuels', '2024-09-01 10:00:00'),
('don-004', 'Association Solidarité', '', '0537556677', 'info@solidarite.ma', '22 Rue Hassan II, Rabat', NULL, '2024-09-01 10:00:00');

-- Note: Dons are stored as recus with donneur_externe if supported, skipping for simplicity

-- ============================================
-- MESSAGES
-- ============================================
INSERT OR IGNORE INTO messages (id, expediteur_id, destinataire_id, contenu, vu, date_envoi) VALUES
('msg-001', 'user-admin', 'user-sec1', 'Bonjour Fatima, merci de vérifier les paiements en retard pour la classe CP-A.', 1, '2024-12-01 09:00:00'),
('msg-002', 'user-sec1', 'user-admin', 'Bonjour, j''ai contacté les parents des élèves en retard. 2 ont promis de payer cette semaine.', 0, '2024-12-01 14:00:00'),
('msg-003', 'user-admin', 'user-sec2', 'Khadija, pouvez-vous valider les dépenses en attente SVP?', 0, '2024-12-02 10:00:00'),
('msg-004', 'user-sec2', 'user-admin', 'Bien reçu, je m''en occupe cet après-midi.', 0, '2024-12-02 11:30:00');
