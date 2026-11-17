-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('GOVERNMENT', 'NGO', 'SCHOOL', 'HEALTH_FACILITY', 'COMMUNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'VIDEO', 'AUDIO', 'INFOGRAPHIC', 'GUIDE', 'QUIZ', 'STORY');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DisasterPhase" AS ENUM ('PREVENTION', 'PREPAREDNESS', 'RESPONSE', 'RECOVERY');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'MONITORING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ChildSafetyStatusValue" AS ENUM ('SAFE', 'MISSING', 'INJURED', 'DECEASED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReunificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'REUNIFIED', 'FAILED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('PSYCHOSOCIAL', 'MEDICAL', 'MATERIAL', 'LEGAL', 'INFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "JournalPrivacy" AS ENUM ('PRIVATE', 'CARE_CIRCLE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CareCircleRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'ASSIGN', 'REVOKE');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('RESILIENCE', 'VULNERABILITY', 'PSYCHOSOCIAL', 'KNOWLEDGE', 'SKILL');

-- CreateEnum
CREATE TYPE "SimulationDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "GrowthAspectType" AS ENUM ('PHYSICAL', 'COGNITIVE', 'EMOTIONAL', 'SOCIAL', 'SPIRITUAL', 'PERSONAL_STRENGTH', 'APPRECIATION_OF_LIFE', 'RELATING_TO_OTHERS', 'NEW_POSSIBILITIES', 'SPIRITUAL_CHANGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "preferredLanguage" TEXT DEFAULT 'id',
    "languageCode" TEXT NOT NULL DEFAULT 'id',
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "provinceCode" TEXT,
    "districtCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "regionCode" TEXT,
    "regionId" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "registeredById" TEXT,
    "createdByUserId" TEXT,
    "fullName" TEXT,
    "displayName" TEXT,
    "nickname" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "ageGroup" TEXT,
    "photoUrl" TEXT,
    "schoolName" TEXT,
    "gradeLevel" TEXT,
    "specialNeeds" TEXT,
    "medicalNotes" TEXT,
    "regionId" TEXT,
    "preferredLanguage" TEXT DEFAULT 'id',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianRelationship" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "userId" TEXT,
    "guardianUserId" TEXT,
    "relationshipType" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "userId" TEXT,
    "guardianUserId" TEXT,
    "organizationId" TEXT,
    "consentType" TEXT NOT NULL,
    "policyVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareAssignment" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "caregiverId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "assignedBy" TEXT,
    "scope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT,
    "tokenHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "level" INTEGER NOT NULL,
    "parentCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalProfile" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "localTerms" JSONB,
    "customContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "iconUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisasterType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "disasterTypeId" TEXT,
    "targetAgeMin" INTEGER,
    "targetAgeMax" INTEGER,
    "targetPhase" "DisasterPhase",
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTranslation" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRegion" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "changeNote" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT,
    "uploadedBy" TEXT,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" DOUBLE PRECISION,
    "altText" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyGuide" (
    "id" TEXT NOT NULL,
    "disasterTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "body" TEXT NOT NULL,
    "bodyEn" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "targetAgeGroup" TEXT,
    "isOfflineReady" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvacuationMap" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "disasterTypeId" TEXT,
    "title" TEXT NOT NULL,
    "mapUrl" TEXT NOT NULL,
    "geoJsonData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvacuationMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "disasterTypeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "SimulationDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "targetAgeGroup" TEXT,
    "targetAgeMin" INTEGER,
    "targetAgeMax" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedVersionId" TEXT,
    "estimatedMinutes" INTEGER,
    "coverImageUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioVersion" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioStep" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT,
    "versionId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "hint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioOption" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "explanation" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationAttempt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioVersionId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER,
    "correctResponses" INTEGER,
    "totalResponses" INTEGER,
    "isPassed" BOOLEAN,
    "durationSec" INTEGER,

    CONSTRAINT "SimulationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "optionId" TEXT,
    "selectedOptionId" TEXT,
    "responseText" TEXT,
    "isCorrect" BOOLEAN,
    "timeTakenMs" INTEGER,
    "timeSpentSeconds" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL DEFAULT 'RESILIENCE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAgeGroup" TEXT,
    "targetAgeMin" INTEGER,
    "targetAgeMax" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentVersionId" TEXT,
    "estimatedMinutes" INTEGER,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentVersion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT,
    "versionId" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "assessmentVersionId" TEXT,
    "childId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completedAt" TIMESTAMP(3),
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "interpretation" TEXT,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "textResponse" TEXT,
    "scaleValue" INTEGER,
    "value" INTEGER,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRule" (
    "id" TEXT NOT NULL,
    "assessmentVersionId" TEXT,
    "assessmentType" TEXT,
    "assessmentTypeEnum" "AssessmentType",
    "condition" JSONB,
    "criteria" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "description" TEXT,
    "recommendationType" TEXT,
    "recommendationContent" JSONB,
    "resourceUrls" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRecommendation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "ruleId" TEXT,
    "recommendationType" TEXT,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPassport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "passportCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPassportContact" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyPassportContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "photoUrl" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingPoint" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyNeed" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "needType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterIncident" (
    "id" TEXT NOT NULL,
    "disasterTypeId" TEXT NOT NULL,
    "organizationId" TEXT,
    "managingOrganizationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "regionCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "affectedCount" INTEGER,
    "createdBy" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisasterIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentChildRecord" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" TEXT DEFAULT 'REPORTED',
    "registeredByUserId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "IncidentChildRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSafetyStatus" (
    "id" TEXT NOT NULL,
    "childId" TEXT,
    "incidentChildRecordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SAFE',
    "statusEnum" "ChildSafetyStatusValue",
    "reportedBy" TEXT,
    "recordedByUserId" TEXT,
    "locationId" TEXT,
    "notes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildSafetyStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelter" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacity" INTEGER,
    "currentOccupancy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasChildFacility" BOOLEAN NOT NULL DEFAULT false,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildLocationRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT,
    "incidentChildRecordId" TEXT,
    "shelterId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "locationDescription" TEXT,
    "recordedBy" TEXT,
    "recordedByUserId" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'RESTRICTED',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ChildLocationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReunificationRequest" (
    "id" TEXT NOT NULL,
    "childId" TEXT,
    "incidentChildRecordId" TEXT,
    "requestedBy" TEXT,
    "requestedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusEnum" "ReunificationStatus",
    "claimantName" TEXT NOT NULL,
    "claimantPhone" TEXT,
    "claimantContact" TEXT,
    "relationship" TEXT,
    "claimantRelationship" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReunificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "reunificationRequestId" TEXT,
    "verifiedBy" TEXT,
    "verifiedByUserId" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "verificationMethod" TEXT,
    "verificationNotes" TEXT,
    "outcome" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverRecord" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "reunificationRequestId" TEXT,
    "handedOverBy" TEXT,
    "handedOverByUserId" TEXT,
    "receivedBy" TEXT,
    "receivedByName" TEXT,
    "receivedByRelationship" TEXT,
    "handoverNotes" TEXT,
    "handoverAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "childId" TEXT,
    "requestedBy" TEXT,
    "requestedByUserId" TEXT,
    "type" TEXT,
    "supportType" TEXT,
    "requestType" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "urgency" TEXT,
    "title" TEXT,
    "description" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAssignment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "supportRequestId" TEXT,
    "assignedTo" TEXT,
    "assignedToUserId" TEXT,
    "assignedUserId" TEXT,
    "assignedBy" TEXT,
    "assignedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "SupportAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMaterial" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "name" TEXT,
    "title" TEXT,
    "type" TEXT,
    "contentUrl" TEXT,
    "duration" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT DEFAULT 'id',
    "quantity" INTEGER,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineContentPackage" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT,
    "title" TEXT,
    "description" TEXT,
    "language" TEXT DEFAULT 'id',
    "packageType" TEXT,
    "sizeBytes" INTEGER,
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "contentManifest" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineContentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncOperation" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "userId" TEXT NOT NULL,
    "incidentId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "operation" TEXT,
    "operationType" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "conflictData" JSONB,
    "clientTimestamp" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryJournalEntry" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "mood" INTEGER,
    "privacy" "JournalPrivacy" NOT NULL DEFAULT 'PRIVATE',
    "activityType" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RecoveryJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalMedia" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeActivity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activityType" TEXT NOT NULL,
    "ageGroupMin" INTEGER,
    "ageGroupMax" INTEGER,
    "durationMin" INTEGER,
    "materials" TEXT[],
    "instructions" TEXT,
    "thumbnailUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthReflection" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT,
    "reflectionText" TEXT,
    "rating" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthAspect" (
    "id" TEXT NOT NULL,
    "reflectionId" TEXT NOT NULL,
    "aspectType" "GrowthAspectType" NOT NULL,
    "score" INTEGER,
    "notes" TEXT,

    CONSTRAINT "GrowthAspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareCircleMember" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CareCircleRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareCircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareCirclePermission" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareCirclePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareCircleInvitation" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "CareCircleRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareCircleInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportNote" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCase" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "referredBy" TEXT NOT NULL,
    "referredTo" TEXT,
    "organizationId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "urgency" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GriefActivity" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GriefActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionCheckIn" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "context" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryBoxEntry" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assetId" TEXT,
    "memoryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryBoxEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LittleStep" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "celebrationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LittleStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GriefSupportConnection" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GriefSupportConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "regionCode" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "regionCode" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramEvaluation" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT,
    "programName" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "evaluatedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT,
    "title" TEXT,
    "context" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "modelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" TEXT,
    "contentUrl" TEXT,
    "estimatedMinutes" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgress" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "childId" TEXT,
    "userId" TEXT,
    "status" "TrainingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProtocol" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "triggerCondition" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "targetRole" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisionSession" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "superviseeId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupervisionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "organizationId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_provinceCode_idx" ON "UserProfile"("provinceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Organization_regionCode_idx" ON "Organization"("regionCode");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "ChildProfile_registeredById_idx" ON "ChildProfile"("registeredById");

-- CreateIndex
CREATE INDEX "ChildProfile_createdByUserId_idx" ON "ChildProfile"("createdByUserId");

-- CreateIndex
CREATE INDEX "ChildProfile_regionId_idx" ON "ChildProfile"("regionId");

-- CreateIndex
CREATE INDEX "ChildProfile_deletedAt_idx" ON "ChildProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "GuardianRelationship_childId_idx" ON "GuardianRelationship"("childId");

-- CreateIndex
CREATE INDEX "GuardianRelationship_userId_idx" ON "GuardianRelationship"("userId");

-- CreateIndex
CREATE INDEX "GuardianRelationship_guardianUserId_idx" ON "GuardianRelationship"("guardianUserId");

-- CreateIndex
CREATE INDEX "ConsentRecord_childId_idx" ON "ConsentRecord"("childId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_status_idx" ON "ConsentRecord"("status");

-- CreateIndex
CREATE INDEX "CareAssignment_childId_idx" ON "CareAssignment"("childId");

-- CreateIndex
CREATE INDEX "CareAssignment_caregiverId_idx" ON "CareAssignment"("caregiverId");

-- CreateIndex
CREATE INDEX "CareAssignment_isActive_idx" ON "CareAssignment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Region_parentCode_idx" ON "Region"("parentCode");

-- CreateIndex
CREATE INDEX "Region_level_idx" ON "Region"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE INDEX "CulturalProfile_regionCode_idx" ON "CulturalProfile"("regionCode");

-- CreateIndex
CREATE UNIQUE INDEX "CulturalProfile_regionCode_languageCode_key" ON "CulturalProfile"("regionCode", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "DisasterType_code_key" ON "DisasterType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_slug_key" ON "ContentItem"("slug");

-- CreateIndex
CREATE INDEX "ContentItem_status_idx" ON "ContentItem"("status");

-- CreateIndex
CREATE INDEX "ContentItem_type_idx" ON "ContentItem"("type");

-- CreateIndex
CREATE INDEX "ContentItem_disasterTypeId_idx" ON "ContentItem"("disasterTypeId");

-- CreateIndex
CREATE INDEX "ContentItem_publishedAt_idx" ON "ContentItem"("publishedAt");

-- CreateIndex
CREATE INDEX "ContentTranslation_contentItemId_idx" ON "ContentTranslation"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentTranslation_languageCode_idx" ON "ContentTranslation"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTranslation_contentItemId_languageCode_key" ON "ContentTranslation"("contentItemId", "languageCode");

-- CreateIndex
CREATE INDEX "ContentRegion_contentItemId_idx" ON "ContentRegion"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentRegion_regionCode_idx" ON "ContentRegion"("regionCode");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRegion_contentItemId_regionCode_key" ON "ContentRegion"("contentItemId", "regionCode");

-- CreateIndex
CREATE INDEX "ContentVersion_contentItemId_idx" ON "ContentVersion"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentItemId_versionNumber_key" ON "ContentVersion"("contentItemId", "versionNumber");

-- CreateIndex
CREATE INDEX "MediaAsset_contentItemId_idx" ON "MediaAsset"("contentItemId");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedBy_idx" ON "MediaAsset"("uploadedBy");

-- CreateIndex
CREATE INDEX "MediaAsset_type_idx" ON "MediaAsset"("type");

-- CreateIndex
CREATE INDEX "EmergencyGuide_disasterTypeId_idx" ON "EmergencyGuide"("disasterTypeId");

-- CreateIndex
CREATE INDEX "EmergencyGuide_priority_idx" ON "EmergencyGuide"("priority");

-- CreateIndex
CREATE INDEX "EvacuationMap_regionCode_idx" ON "EvacuationMap"("regionCode");

-- CreateIndex
CREATE INDEX "EvacuationMap_disasterTypeId_idx" ON "EvacuationMap"("disasterTypeId");

-- CreateIndex
CREATE INDEX "EmergencyContact_regionCode_idx" ON "EmergencyContact"("regionCode");

-- CreateIndex
CREATE INDEX "EmergencyContact_type_idx" ON "EmergencyContact"("type");

-- CreateIndex
CREATE INDEX "SimulationScenario_disasterTypeId_idx" ON "SimulationScenario"("disasterTypeId");

-- CreateIndex
CREATE INDEX "SimulationScenario_isPublished_idx" ON "SimulationScenario"("isPublished");

-- CreateIndex
CREATE INDEX "ScenarioVersion_scenarioId_idx" ON "ScenarioVersion"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVersion_scenarioId_versionNumber_key" ON "ScenarioVersion"("scenarioId", "versionNumber");

-- CreateIndex
CREATE INDEX "ScenarioStep_scenarioId_idx" ON "ScenarioStep"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioStep_versionId_idx" ON "ScenarioStep"("versionId");

-- CreateIndex
CREATE INDEX "ScenarioOption_stepId_idx" ON "ScenarioOption"("stepId");

-- CreateIndex
CREATE INDEX "SimulationAttempt_childId_idx" ON "SimulationAttempt"("childId");

-- CreateIndex
CREATE INDEX "SimulationAttempt_scenarioId_idx" ON "SimulationAttempt"("scenarioId");

-- CreateIndex
CREATE INDEX "SimulationAttempt_userId_idx" ON "SimulationAttempt"("userId");

-- CreateIndex
CREATE INDEX "SimulationResponse_attemptId_idx" ON "SimulationResponse"("attemptId");

-- CreateIndex
CREATE INDEX "SimulationResponse_stepId_idx" ON "SimulationResponse"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationResponse_attemptId_stepId_key" ON "SimulationResponse"("attemptId", "stepId");

-- CreateIndex
CREATE INDEX "Assessment_type_idx" ON "Assessment"("type");

-- CreateIndex
CREATE INDEX "Assessment_isPublished_idx" ON "Assessment"("isPublished");

-- CreateIndex
CREATE INDEX "Assessment_isActive_idx" ON "Assessment"("isActive");

-- CreateIndex
CREATE INDEX "AssessmentVersion_assessmentId_idx" ON "AssessmentVersion"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentVersion_assessmentId_versionNumber_key" ON "AssessmentVersion"("assessmentId", "versionNumber");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_versionId_idx" ON "AssessmentQuestion"("versionId");

-- CreateIndex
CREATE INDEX "AssessmentOption_questionId_idx" ON "AssessmentOption"("questionId");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_assessmentId_idx" ON "AssessmentSubmission"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_childId_idx" ON "AssessmentSubmission"("childId");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_submittedByUserId_idx" ON "AssessmentSubmission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_submittedAt_idx" ON "AssessmentSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "AssessmentResponse_submissionId_idx" ON "AssessmentResponse"("submissionId");

-- CreateIndex
CREATE INDEX "AssessmentResponse_questionId_idx" ON "AssessmentResponse"("questionId");

-- CreateIndex
CREATE INDEX "RecommendationRule_assessmentType_idx" ON "RecommendationRule"("assessmentType");

-- CreateIndex
CREATE INDEX "RecommendationRule_assessmentVersionId_idx" ON "RecommendationRule"("assessmentVersionId");

-- CreateIndex
CREATE INDEX "RecommendationRule_isActive_idx" ON "RecommendationRule"("isActive");

-- CreateIndex
CREATE INDEX "AssessmentRecommendation_submissionId_idx" ON "AssessmentRecommendation"("submissionId");

-- CreateIndex
CREATE INDEX "AssessmentRecommendation_ruleId_idx" ON "AssessmentRecommendation"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPassport_childId_key" ON "SafetyPassport"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPassport_passportCode_key" ON "SafetyPassport"("passportCode");

-- CreateIndex
CREATE INDEX "SafetyPassport_passportCode_idx" ON "SafetyPassport"("passportCode");

-- CreateIndex
CREATE INDEX "SafetyPassport_status_idx" ON "SafetyPassport"("status");

-- CreateIndex
CREATE INDEX "SafetyPassportContact_passportId_idx" ON "SafetyPassportContact"("passportId");

-- CreateIndex
CREATE INDEX "FamilyMember_passportId_idx" ON "FamilyMember"("passportId");

-- CreateIndex
CREATE INDEX "MeetingPoint_passportId_idx" ON "MeetingPoint"("passportId");

-- CreateIndex
CREATE INDEX "EmergencyNeed_passportId_idx" ON "EmergencyNeed"("passportId");

-- CreateIndex
CREATE INDEX "DisasterIncident_status_idx" ON "DisasterIncident"("status");

-- CreateIndex
CREATE INDEX "DisasterIncident_severity_idx" ON "DisasterIncident"("severity");

-- CreateIndex
CREATE INDEX "DisasterIncident_regionCode_idx" ON "DisasterIncident"("regionCode");

-- CreateIndex
CREATE INDEX "DisasterIncident_occurredAt_idx" ON "DisasterIncident"("occurredAt");

-- CreateIndex
CREATE INDEX "IncidentChildRecord_incidentId_idx" ON "IncidentChildRecord"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentChildRecord_childId_idx" ON "IncidentChildRecord"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentChildRecord_incidentId_childId_key" ON "IncidentChildRecord"("incidentId", "childId");

-- CreateIndex
CREATE INDEX "ChildSafetyStatus_childId_idx" ON "ChildSafetyStatus"("childId");

-- CreateIndex
CREATE INDEX "ChildSafetyStatus_incidentChildRecordId_idx" ON "ChildSafetyStatus"("incidentChildRecordId");

-- CreateIndex
CREATE INDEX "ChildSafetyStatus_reportedAt_idx" ON "ChildSafetyStatus"("reportedAt");

-- CreateIndex
CREATE INDEX "Shelter_regionCode_idx" ON "Shelter"("regionCode");

-- CreateIndex
CREATE INDEX "Shelter_isActive_idx" ON "Shelter"("isActive");

-- CreateIndex
CREATE INDEX "ChildLocationRecord_childId_idx" ON "ChildLocationRecord"("childId");

-- CreateIndex
CREATE INDEX "ChildLocationRecord_incidentChildRecordId_idx" ON "ChildLocationRecord"("incidentChildRecordId");

-- CreateIndex
CREATE INDEX "ChildLocationRecord_shelterId_idx" ON "ChildLocationRecord"("shelterId");

-- CreateIndex
CREATE INDEX "ChildLocationRecord_recordedAt_idx" ON "ChildLocationRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "ReunificationRequest_childId_idx" ON "ReunificationRequest"("childId");

-- CreateIndex
CREATE INDEX "ReunificationRequest_incidentChildRecordId_idx" ON "ReunificationRequest"("incidentChildRecordId");

-- CreateIndex
CREATE INDEX "ReunificationRequest_status_idx" ON "ReunificationRequest"("status");

-- CreateIndex
CREATE INDEX "IdentityVerification_requestId_idx" ON "IdentityVerification"("requestId");

-- CreateIndex
CREATE INDEX "IdentityVerification_reunificationRequestId_idx" ON "IdentityVerification"("reunificationRequestId");

-- CreateIndex
CREATE INDEX "HandoverRecord_requestId_idx" ON "HandoverRecord"("requestId");

-- CreateIndex
CREATE INDEX "HandoverRecord_reunificationRequestId_idx" ON "HandoverRecord"("reunificationRequestId");

-- CreateIndex
CREATE INDEX "SupportRequest_incidentId_idx" ON "SupportRequest"("incidentId");

-- CreateIndex
CREATE INDEX "SupportRequest_childId_idx" ON "SupportRequest"("childId");

-- CreateIndex
CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");

-- CreateIndex
CREATE INDEX "SupportAssignment_supportRequestId_idx" ON "SupportAssignment"("supportRequestId");

-- CreateIndex
CREATE INDEX "SupportAssignment_assignedTo_idx" ON "SupportAssignment"("assignedTo");

-- CreateIndex
CREATE INDEX "SupportAssignment_assignedUserId_idx" ON "SupportAssignment"("assignedUserId");

-- CreateIndex
CREATE INDEX "SupportMaterial_requestId_idx" ON "SupportMaterial"("requestId");

-- CreateIndex
CREATE INDEX "SupportMaterial_language_idx" ON "SupportMaterial"("language");

-- CreateIndex
CREATE INDEX "SupportMaterial_isActive_idx" ON "SupportMaterial"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineContentPackage_version_key" ON "OfflineContentPackage"("version");

-- CreateIndex
CREATE INDEX "OfflineContentPackage_isActive_idx" ON "OfflineContentPackage"("isActive");

-- CreateIndex
CREATE INDEX "OfflineContentPackage_language_idx" ON "OfflineContentPackage"("language");

-- CreateIndex
CREATE INDEX "SyncOperation_deviceId_idx" ON "SyncOperation"("deviceId");

-- CreateIndex
CREATE INDEX "SyncOperation_userId_idx" ON "SyncOperation"("userId");

-- CreateIndex
CREATE INDEX "SyncOperation_status_idx" ON "SyncOperation"("status");

-- CreateIndex
CREATE INDEX "SyncOperation_entityType_entityId_idx" ON "SyncOperation"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RecoveryJournalEntry_childId_idx" ON "RecoveryJournalEntry"("childId");

-- CreateIndex
CREATE INDEX "RecoveryJournalEntry_privacy_idx" ON "RecoveryJournalEntry"("privacy");

-- CreateIndex
CREATE INDEX "RecoveryJournalEntry_createdAt_idx" ON "RecoveryJournalEntry"("createdAt");

-- CreateIndex
CREATE INDEX "RecoveryJournalEntry_deletedAt_idx" ON "RecoveryJournalEntry"("deletedAt");

-- CreateIndex
CREATE INDEX "JournalMedia_entryId_idx" ON "JournalMedia"("entryId");

-- CreateIndex
CREATE INDEX "CreativeActivity_activityType_idx" ON "CreativeActivity"("activityType");

-- CreateIndex
CREATE INDEX "CreativeActivity_isPublished_idx" ON "CreativeActivity"("isPublished");

-- CreateIndex
CREATE INDEX "GrowthReflection_childId_idx" ON "GrowthReflection"("childId");

-- CreateIndex
CREATE INDEX "GrowthReflection_activityId_idx" ON "GrowthReflection"("activityId");

-- CreateIndex
CREATE INDEX "GrowthAspect_reflectionId_idx" ON "GrowthAspect"("reflectionId");

-- CreateIndex
CREATE INDEX "CareCircleMember_childId_idx" ON "CareCircleMember"("childId");

-- CreateIndex
CREATE INDEX "CareCircleMember_userId_idx" ON "CareCircleMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CareCircleMember_childId_userId_key" ON "CareCircleMember"("childId", "userId");

-- CreateIndex
CREATE INDEX "CareCirclePermission_memberId_idx" ON "CareCirclePermission"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "CareCirclePermission_memberId_permission_key" ON "CareCirclePermission"("memberId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "CareCircleInvitation_token_key" ON "CareCircleInvitation"("token");

-- CreateIndex
CREATE INDEX "CareCircleInvitation_childId_idx" ON "CareCircleInvitation"("childId");

-- CreateIndex
CREATE INDEX "CareCircleInvitation_token_idx" ON "CareCircleInvitation"("token");

-- CreateIndex
CREATE INDEX "CareCircleInvitation_status_idx" ON "CareCircleInvitation"("status");

-- CreateIndex
CREATE INDEX "SupportNote_memberId_idx" ON "SupportNote"("memberId");

-- CreateIndex
CREATE INDEX "SupportNote_childId_idx" ON "SupportNote"("childId");

-- CreateIndex
CREATE INDEX "ReferralCase_childId_idx" ON "ReferralCase"("childId");

-- CreateIndex
CREATE INDEX "ReferralCase_status_idx" ON "ReferralCase"("status");

-- CreateIndex
CREATE INDEX "ReferralCase_referredBy_idx" ON "ReferralCase"("referredBy");

-- CreateIndex
CREATE INDEX "GriefActivity_childId_idx" ON "GriefActivity"("childId");

-- CreateIndex
CREATE INDEX "GriefActivity_activityType_idx" ON "GriefActivity"("activityType");

-- CreateIndex
CREATE INDEX "EmotionCheckIn_childId_idx" ON "EmotionCheckIn"("childId");

-- CreateIndex
CREATE INDEX "EmotionCheckIn_checkedInAt_idx" ON "EmotionCheckIn"("checkedInAt");

-- CreateIndex
CREATE INDEX "MemoryBoxEntry_childId_idx" ON "MemoryBoxEntry"("childId");

-- CreateIndex
CREATE INDEX "LittleStep_childId_idx" ON "LittleStep"("childId");

-- CreateIndex
CREATE INDEX "LittleStep_completedAt_idx" ON "LittleStep"("completedAt");

-- CreateIndex
CREATE INDEX "GriefSupportConnection_childId_idx" ON "GriefSupportConnection"("childId");

-- CreateIndex
CREATE INDEX "GriefSupportConnection_professionalId_idx" ON "GriefSupportConnection"("professionalId");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_snapshotType_idx" ON "DashboardSnapshot"("snapshotType");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_regionCode_idx" ON "DashboardSnapshot"("regionCode");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_generatedAt_idx" ON "DashboardSnapshot"("generatedAt");

-- CreateIndex
CREATE INDEX "Facility_regionCode_idx" ON "Facility"("regionCode");

-- CreateIndex
CREATE INDEX "Facility_type_idx" ON "Facility"("type");

-- CreateIndex
CREATE INDEX "Facility_isActive_idx" ON "Facility"("isActive");

-- CreateIndex
CREATE INDEX "ProgramEvaluation_facilityId_idx" ON "ProgramEvaluation"("facilityId");

-- CreateIndex
CREATE INDEX "ProgramEvaluation_periodStart_idx" ON "ProgramEvaluation"("periodStart");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE INDEX "AIConversation_childId_idx" ON "AIConversation"("childId");

-- CreateIndex
CREATE INDEX "AIConversation_isActive_idx" ON "AIConversation"("isActive");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE INDEX "AIMessage_createdAt_idx" ON "AIMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_conversationId_idx" ON "AIUsageLog"("conversationId");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "TrainingModule_targetRole_idx" ON "TrainingModule"("targetRole");

-- CreateIndex
CREATE INDEX "TrainingModule_isPublished_idx" ON "TrainingModule"("isPublished");

-- CreateIndex
CREATE INDEX "TrainingProgress_moduleId_idx" ON "TrainingProgress"("moduleId");

-- CreateIndex
CREATE INDEX "TrainingProgress_childId_idx" ON "TrainingProgress"("childId");

-- CreateIndex
CREATE INDEX "TrainingProgress_userId_idx" ON "TrainingProgress"("userId");

-- CreateIndex
CREATE INDEX "TrainingProgress_status_idx" ON "TrainingProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgress_moduleId_childId_key" ON "TrainingProgress"("moduleId", "childId");

-- CreateIndex
CREATE INDEX "ReferralProtocol_isActive_idx" ON "ReferralProtocol"("isActive");

-- CreateIndex
CREATE INDEX "SupervisionSession_supervisorId_idx" ON "SupervisionSession"("supervisorId");

-- CreateIndex
CREATE INDEX "SupervisionSession_superviseeId_idx" ON "SupervisionSession"("superviseeId");

-- CreateIndex
CREATE INDEX "SupervisionSession_scheduledAt_idx" ON "SupervisionSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_provinceCode_fkey" FOREIGN KEY ("provinceCode") REFERENCES "Region"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationship" ADD CONSTRAINT "GuardianRelationship_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationship" ADD CONSTRAINT "GuardianRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationship" ADD CONSTRAINT "GuardianRelationship_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Region"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalProfile" ADD CONSTRAINT "CulturalProfile_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalProfile" ADD CONSTRAINT "CulturalProfile_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_disasterTypeId_fkey" FOREIGN KEY ("disasterTypeId") REFERENCES "DisasterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTranslation" ADD CONSTRAINT "ContentTranslation_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTranslation" ADD CONSTRAINT "ContentTranslation_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRegion" ADD CONSTRAINT "ContentRegion_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRegion" ADD CONSTRAINT "ContentRegion_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyGuide" ADD CONSTRAINT "EmergencyGuide_disasterTypeId_fkey" FOREIGN KEY ("disasterTypeId") REFERENCES "DisasterType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvacuationMap" ADD CONSTRAINT "EvacuationMap_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvacuationMap" ADD CONSTRAINT "EvacuationMap_disasterTypeId_fkey" FOREIGN KEY ("disasterTypeId") REFERENCES "DisasterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_disasterTypeId_fkey" FOREIGN KEY ("disasterTypeId") REFERENCES "DisasterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "ScenarioVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioVersion" ADD CONSTRAINT "ScenarioVersion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioStep" ADD CONSTRAINT "ScenarioStep_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioStep" ADD CONSTRAINT "ScenarioStep_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ScenarioVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioOption" ADD CONSTRAINT "ScenarioOption_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ScenarioStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttempt" ADD CONSTRAINT "SimulationAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttempt" ADD CONSTRAINT "SimulationAttempt_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationAttempt" ADD CONSTRAINT "SimulationAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResponse" ADD CONSTRAINT "SimulationResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SimulationAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResponse" ADD CONSTRAINT "SimulationResponse_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ScenarioStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResponse" ADD CONSTRAINT "SimulationResponse_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ScenarioOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResponse" ADD CONSTRAINT "SimulationResponse_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "ScenarioOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "AssessmentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentVersion" ADD CONSTRAINT "AssessmentVersion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AssessmentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOption" ADD CONSTRAINT "AssessmentOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "AssessmentOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRule" ADD CONSTRAINT "RecommendationRule_assessmentVersionId_fkey" FOREIGN KEY ("assessmentVersionId") REFERENCES "AssessmentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRecommendation" ADD CONSTRAINT "AssessmentRecommendation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRecommendation" ADD CONSTRAINT "AssessmentRecommendation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RecommendationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPassport" ADD CONSTRAINT "SafetyPassport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPassportContact" ADD CONSTRAINT "SafetyPassportContact_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "SafetyPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "SafetyPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingPoint" ADD CONSTRAINT "MeetingPoint_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "SafetyPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyNeed" ADD CONSTRAINT "EmergencyNeed_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "SafetyPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterIncident" ADD CONSTRAINT "DisasterIncident_disasterTypeId_fkey" FOREIGN KEY ("disasterTypeId") REFERENCES "DisasterType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterIncident" ADD CONSTRAINT "DisasterIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterIncident" ADD CONSTRAINT "DisasterIncident_managingOrganizationId_fkey" FOREIGN KEY ("managingOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterIncident" ADD CONSTRAINT "DisasterIncident_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentChildRecord" ADD CONSTRAINT "IncidentChildRecord_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentChildRecord" ADD CONSTRAINT "IncidentChildRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSafetyStatus" ADD CONSTRAINT "ChildSafetyStatus_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSafetyStatus" ADD CONSTRAINT "ChildSafetyStatus_incidentChildRecordId_fkey" FOREIGN KEY ("incidentChildRecordId") REFERENCES "IncidentChildRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSafetyStatus" ADD CONSTRAINT "ChildSafetyStatus_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "ChildLocationRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelter" ADD CONSTRAINT "Shelter_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLocationRecord" ADD CONSTRAINT "ChildLocationRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLocationRecord" ADD CONSTRAINT "ChildLocationRecord_incidentChildRecordId_fkey" FOREIGN KEY ("incidentChildRecordId") REFERENCES "IncidentChildRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLocationRecord" ADD CONSTRAINT "ChildLocationRecord_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReunificationRequest" ADD CONSTRAINT "ReunificationRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReunificationRequest" ADD CONSTRAINT "ReunificationRequest_incidentChildRecordId_fkey" FOREIGN KEY ("incidentChildRecordId") REFERENCES "IncidentChildRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReunificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_reunificationRequestId_fkey" FOREIGN KEY ("reunificationRequestId") REFERENCES "ReunificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverRecord" ADD CONSTRAINT "HandoverRecord_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReunificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverRecord" ADD CONSTRAINT "HandoverRecord_reunificationRequestId_fkey" FOREIGN KEY ("reunificationRequestId") REFERENCES "ReunificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMaterial" ADD CONSTRAINT "SupportMaterial_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncOperation" ADD CONSTRAINT "SyncOperation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryJournalEntry" ADD CONSTRAINT "RecoveryJournalEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalMedia" ADD CONSTRAINT "JournalMedia_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "RecoveryJournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalMedia" ADD CONSTRAINT "JournalMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthReflection" ADD CONSTRAINT "GrowthReflection_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthReflection" ADD CONSTRAINT "GrowthReflection_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CreativeActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthAspect" ADD CONSTRAINT "GrowthAspect_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "GrowthReflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareCircleMember" ADD CONSTRAINT "CareCircleMember_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareCirclePermission" ADD CONSTRAINT "CareCirclePermission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CareCircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportNote" ADD CONSTRAINT "SupportNote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CareCircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GriefActivity" ADD CONSTRAINT "GriefActivity_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionCheckIn" ADD CONSTRAINT "EmotionCheckIn_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryBoxEntry" ADD CONSTRAINT "MemoryBoxEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryBoxEntry" ADD CONSTRAINT "MemoryBoxEntry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LittleStep" ADD CONSTRAINT "LittleStep_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEvaluation" ADD CONSTRAINT "ProgramEvaluation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisionSession" ADD CONSTRAINT "SupervisionSession_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisionSession" ADD CONSTRAINT "SupervisionSession_superviseeId_fkey" FOREIGN KEY ("superviseeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
