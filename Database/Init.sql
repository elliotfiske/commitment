drop database if exists CHSdb;
create database CHSdb;
use CHSdb;

create table Person (
    id int(11) AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(30),
    lastName VARCHAR(30) not null,
    email VARCHAR(30) not null,
    password VARCHAR(50),
    whenRegistered DATETIME not null,
    termsAccepted DATETIME not null,
    role  int(11) UNSIGNED not null,
    UNIQUE KEY(email)
);

create table Course (
    name VARCHAR(30) PRIMARY KEY,
    ownerId int(11) not null,
    Constraint FKCourseOwnerId Foreign key(ownerId) references Person(id)
    on delete cascade
);

create table Challenge (
    name VARCHAR(30) PRIMARY KEY,
    description VARCHAR(90),
    attsAllowed int(11),
    courseName VARCHAR(30) NOT NULL,
    Constraint FKChallengeCourse Foreign key(courseName) references Course(name)
    on delete cascade
);

create table Attempt (
    id int(11) AUTO_INCREMENT PRIMARY KEY,
    ownerId int(11) not null,
    challengeName VARCHAR(30) not null,
    duration int(11) UNSIGNED not null,
    score int(11),
    startTime DATETIME not null,
    state int(11) not null,
    input VARCHAR(1024) DEFAULT "",
    Constraint FKChallengeName FOREIGN KEY(challengeName) REFERENCES Challenge(name)
     on delete cascade on update cascade,
    Constraint FKOwnerId Foreign key(ownerId) references Person(id)
    on delete cascade
);

create table ShopItem (
   id int(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(30) not null,
   courseName VARCHAR(30) NOT NULL,
   cost int(11),
   Constraint FKShopCourse Foreign key(courseName) references Course(name)
    on delete cascade
);

create table StudentPurchase (
  purchaseId INT(11) AUTO_INCREMENT PRIMARY KEY,
  prsId INT(11) NOT NULL,
  itemId INT(11) NOT NULL,
  UNIQUE KEY (prsId, itemId),
  Constraint FKPurchaseStudentId Foreign key(prsId) references Person(id)
  on delete cascade,
  Constraint FKPurchaseItem Foreign key(itemId) references ShopItem(id)
  on delete cascade
);

create table Enrollment (
    enrId INT(11) AUTO_INCREMENT PRIMARY KEY,
    prsId INT(11) NOT NULL,
    courseName VARCHAR(30) NOT NULL,
    whenEnrolled DATETIME not null,
    creditsEarned INT(11) DEFAULT 0,
    UNIQUE KEY (prsId, courseName),
    Constraint FKEnrollmentStudentId Foreign key(prsId) references Person(id)
    on delete cascade,
    Constraint FKEnrollmentCourse Foreign key(courseName) references Course(name)
    on delete cascade
);

INSERT INTO Person (
    id, firstName, lastName, email,
    password, whenRegistered, termsAccepted, role
) VALUES (
    1, "Admin", "IAM", "Admin@11.com",
    "password", NOW(), NOW(), 2
);
