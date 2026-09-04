import React, { useMemo, Suspense, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Map detection object names to 3D model file paths
 * These files are served by the FastAPI backend from backend/3dmodels.
 */
const MODEL_BASE_URL = process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:8000';
const MODEL_MAP = {
  'human body': `${MODEL_BASE_URL}/3dmodels/human%20body.glb`,
  'ghost net': `${MODEL_BASE_URL}/3dmodels/ghost%20net.glb`,
  'ship': `${MODEL_BASE_URL}/3dmodels/ship.glb`,
  'ship wreck': `${MODEL_BASE_URL}/3dmodels/ship.glb`,
  'plane wreck': `${MODEL_BASE_URL}/3dmodels/plane.glb`,
  'plane': `${MODEL_BASE_URL}/3dmodels/plane.glb`,
  'wreck': `${MODEL_BASE_URL}/3dmodels/ship.glb`,
  'net': `${MODEL_BASE_URL}/3dmodels/ghost%20net.glb`,
};

export function hasModelForDetection(name) {
  const objectName = name ? name.toLowerCase().trim() : "";
  return Boolean(MODEL_MAP[objectName]);
}

/**
 * Fallback sphere when model is not found
 */
export function FallbackSphere({ size = 2, color = '#ffaa00' }) {
  return (
    <mesh>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.5}
        wireframe={false}
      />
    </mesh>
  );
}

export function FallbackCube({ size = 8, color = '#ffaa00' }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

/**
 * Model component that loads GLTF/GLB files
 * Renders only the requested backend model; failures render nothing.
 */
const MODEL_TARGET_SIZE = {
  'human body': 12,
  'ghost net': 12,
  'ship': 18,
  'ship wreck': 18,
  'wreck': 18,
  'plane': 16,
  'plane wreck': 16,
};

function ModelWithGLTF({ modelPath, objectName, scale = 1 }) {
  const [loadError, setLoadError] = useState(null);
  
  // Load the model using useGLTF hook - MUST BE CALLED FIRST
  const gltfData = useGLTF(modelPath, undefined, 
    (data) => {
      console.log(`✓ Model loaded successfully: ${modelPath}`);
    },
    (e) => {
      console.error(`❌ GLTF loading error for ${modelPath}:`, e);
      setLoadError(e.message || 'Failed to load model');
    }
  );
  
  // MUST call useMemo BEFORE any early returns (React hooks rule)
  const clonedScene = useMemo(() => {
    // Only proceed if we have a valid scene
    if (!gltfData || !gltfData.scene) {
      return null;
    }
    
    try {
      console.log(`✓ Creating cloned scene for ${modelPath}`);
      const clone = gltfData.scene.clone(true);
      const bounds = new THREE.Box3().setFromObject(clone);
      const size = bounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      const targetSize = MODEL_TARGET_SIZE[objectName] || 12;

      if (maxDimension > 0) {
        const normalizedScale = targetSize / maxDimension;
        clone.scale.setScalar(normalizedScale);

        // Center the model horizontally and place its lowest point at the marker.
        const scaledBounds = new THREE.Box3().setFromObject(clone);
        const center = scaledBounds.getCenter(new THREE.Vector3());
        clone.position.x -= center.x;
        clone.position.z -= center.z;
        clone.position.y -= scaledBounds.min.y;
      }
      
      // Traverse and set up materials
      clone.traverse((node) => {
        if (node.isMesh) {
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material = node.material.map(m => m.clone());
            } else {
              node.material = node.material.clone();
            }
          }
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      return clone;
    } catch (error) {
      console.error(`❌ Error cloning scene for ${modelPath}:`, error);
      return null;
    }
  }, [gltfData, modelPath, objectName]);

  // NOW we can do conditional logic after all hooks are called
  if (loadError) {
    console.warn(`⚠️ Model failed to load: ${modelPath} - ${loadError}`);
    return null;
  }
  
  if (!clonedScene) {
    if (!gltfData || !gltfData.scene) {
      console.log(`⏳ Loading model... ${modelPath}`);
    } else {
      console.warn(`⚠️ Failed to create cloned scene for ${modelPath}`);
    }
    return null;
  }

  return (
    <group scale={[scale, scale, scale]}>
      <primitive object={clonedScene} />
    </group>
  );
}

/**
 * Error boundary for model loading
 */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`✗ Model loading error: ${error.message}`, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * DetectionObject3D - Renders the appropriate 3D model based on detection type
 * Includes model loading for backend-provided assets only.
 */
export function DetectionObject3D({ detection, scale = 1, showLabel = true }) {
  const objectName = detection.name ? detection.name.toLowerCase().trim() : 'unknown';
  
  // Only mapped detections should create a 3D object.
  const modelPath = MODEL_MAP[objectName];
  const hasModel = !!modelPath;

  if (!hasModel) {
    return <FallbackCube />;
  }
  
  // Log which model we're trying to load
  if (hasModel) {
    console.log(`🔄 Loading 3D model for "${objectName}": ${modelPath}`);
  } else {
    console.log(`⚠ No 3D model found for "${objectName}", using fallback sphere`);
  }
  
  return (
    <group>
      <Suspense fallback={null}>
        <ModelErrorBoundary>
          <ModelWithGLTF modelPath={modelPath} objectName={objectName} scale={scale} />
        </ModelErrorBoundary>
      </Suspense>
    </group>
  );
}

export default DetectionObject3D;
