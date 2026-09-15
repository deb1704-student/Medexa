from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class FHIRMeta(BaseModel):
    versionId: str = "1"
    lastUpdated: str
    profile: List[str] = [
        "https://nrces.in/ndhm/fhir/r4/StructureDefinition/ServiceRequest"
    ]

class FHIRCoding(BaseModel):
    system: str
    code: str
    display: str

class FHIRCodeableConcept(BaseModel):
    coding: List[FHIRCoding]
    text: Optional[str] = None

class FHIRReference(BaseModel):
    reference: str
    display: Optional[str] = None

class FHIRPatientResource(BaseModel):
    resourceType: str = "Patient"
    id: str
    name: List[Dict[str, Any]]
    gender: str
    birthDate: Optional[str] = None
    telecom: Optional[List[Dict[str, Any]]] = None
    address: Optional[List[Dict[str, Any]]] = None

class FHIRObservationResource(BaseModel):
    resourceType: str = "Observation"
    id: str
    status: str = "final"
    code: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime: str
    valueQuantity: Optional[Dict[str, Any]] = None
    valueString: Optional[str] = None

class FHIRServiceRequestResource(BaseModel):
    resourceType: str = "ServiceRequest"
    id: str
    meta: FHIRMeta
    status: str
    intent: str = "order"
    priority: str
    subject: FHIRReference
    requester: FHIRReference
    performer: Optional[List[FHIRReference]] = None
    reasonCode: Optional[List[FHIRCodeableConcept]] = None
    authoredOn: str

class FHIRBundleEntry(BaseModel):
    fullUrl: str
    resource: Dict[str, Any]

class FHIRBundle(BaseModel):
    resourceType: str = "Bundle"
    id: str
    meta: Dict[str, Any] = {
        "lastUpdated": "",
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
    }
    type: str = "collection"
    entry: List[FHIRBundleEntry]
