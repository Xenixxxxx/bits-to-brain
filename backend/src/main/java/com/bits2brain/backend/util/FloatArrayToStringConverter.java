package com.bits2brain.backend.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;

@Converter
public class FloatArrayToStringConverter implements AttributeConverter<float[], String> {

    @Override
    public String convertToDatabaseColumn(float[] floats) {
        if (floats == null) return null;
        return Arrays.toString(floats)  // e.g. [0.1, 0.2, 0.3]
                .replace("[", "")       // -> 0.1, 0.2, 0.3
                .replace("]", "");
    }

    @Override
    public float[] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new float[0];
        String[] tokens = dbData.split(",");
        float[] result = new float[tokens.length];
        for (int i = 0; i < tokens.length; i++) {
            result[i] = Float.parseFloat(tokens[i].trim());
        }
        return result;
    }
}
