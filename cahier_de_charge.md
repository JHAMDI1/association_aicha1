application pour une association 'Aicha' جمعية قرانية
on va cree une application desktop pour cette association pour gestion des eleves, employer, e,segnant, classe et recu (paiement cache avec recu) 
alors je pense les tables sont: 1) ensegnant: id, nom, prenom, adresse, tel, email, sexe, photo, date naissance, date d'ajout, date de modification, date de suppression, etat
2) eleves: id, nom, prenom, adresse, tel, email, sexe, photo, date naissance, date d'ajout, date de modification, date de suppression, etat
3) employer: id, nom, prenom, adresse, tel, email, sexe, photo, date naissance, date d'ajout, date de modification, date de suppression, fonction avec enum (secretaire, femme de menage, jardinier et electricien)
4) classe: id, nom, date d'ajout, date de modification, date de suppression, (tabe de jointure entre eleve et ensegnant (eleve_id, ensegnant_id)), number, employer_id, id libele
5) recu: id, nom, prenom, adresse, tel, email, sexe, photo, date naissance, date d'ajout, date de modification, date de suppression, etat
6) libele: id, nom, date d'ajout, date de modification, date de suppression, anné 1, anné 2, anné 3, anné 4, anné 5, massar 1 , massar 2, massar 3, massar 4, massar 5, chatibia , 
07) donner : id, nom, prenom, adresse, tel, email, sexe, photo, date naissance, date d'ajout, date de modification, date de suppression, cin 
08) recu: id, id secretaire (le secretaire donne le recu) ,number, numero carnet, date, type (frais mensuel, assurance,donner), montant, etat.
09) ordre de payment: id, id secretaire (le secretaire donne le recu) ,number, numero carnet, date, montant, beneficiaire, etat.


lorsque on va remplir le recu il faut que le secretaire voi dans lapplication la page de payment il ya 12 case a cocher pour les 12 mois et chaque mois payer doi etre disabled et cocher pour que le secretaire compris les mois non payer et peux cocher le mois a payer et prendre un recu pour chaque etudiant .


le donner peut etre un eleve, un menbre de lassociation ou un personne quelconque.

lorsque quon va cree un ordre de payment on peut trouver liste pour selectionne facture ou autre si facture on va remplir ces donner et obligatoirement la photo de facture avec note non obligatoire si autre il faut ajouter le nom darticle et le prix (1 ou plus article).

droit dacce. admin a accés a tout et peut ajouter, modifier, supprimer, et voir tout.(les autres demandez a ladministrateur les demande de supression (tous supression des donne avec confirmation de ladministrateur))
secretaire peut ajouter, modifier, des eleves, employer, classe, donner, recu, ordre de payment, et voir tout.

nb: les modification des  payement et tous les operation monaitaire sa fait avec confirmation de ladministrateur.

tous les menbre peuvent laisser des message pour les autres (par exemple le secretaire laisse une message pour ladmin et lorsque ladmin ouvre son compte dans lapp il trouve une notification et le message).


